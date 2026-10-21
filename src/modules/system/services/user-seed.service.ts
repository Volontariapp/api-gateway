import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Logger } from '@volontariapp/logger';
import { faker } from '@faker-js/faker';
import { lastValueFrom } from 'rxjs';
import type { Metadata } from '@grpc/grpc-js';
import {
  USER_SERVICE_NAME,
  type UserServiceClient,
  SOCIAL_USER_NODE_COMMAND_SERVICE_NAME,
  type SocialUserNodeCommandServiceClient,
} from '@volontariapp/contracts-nest';
import { USER_PACKAGE, SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import type { WithMetadata } from '../../../common/types/grpc.types.js';
import {
  GOLDEN_PERSONAS,
  SEED_DEFAULT_PASSWORD,
  generate500Personas,
} from '../constants/seed-personas.constant.js';
import type { SeedCountStatsDTO } from '../common/index.js';

export interface SeededUsersResult {
  goldenUserIds: Map<string, string>; // focus -> userId
  userIds: string[];
}

@Injectable()
export class UserSeedService implements OnModuleInit {
  private readonly logger = new Logger({ context: UserSeedService.name });
  private userService!: WithMetadata<UserServiceClient>;
  private socialUserNodeService!: WithMetadata<SocialUserNodeCommandServiceClient>;

  constructor(
    @Inject(USER_PACKAGE) private readonly userClient: ClientGrpc,
    @Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService = this.userClient.getService<UserServiceClient>(USER_SERVICE_NAME);
    this.socialUserNodeService = this.socialClient.getService<SocialUserNodeCommandServiceClient>(
      SOCIAL_USER_NODE_COMMAND_SERVICE_NAME,
    );
  }

  /**
   * Crée les 5 Golden Personas et complète avec les 500 profils de volontaires jusqu'à targetCount.
   */
  async seedUsers(
    targetCount: number,
    concurrency: number,
    baseMetadata: Metadata,
    status: SeedCountStatsDTO,
  ): Promise<SeededUsersResult> {
    this.logger.log(
      `👤 Seeding users (Target: ${String(targetCount)}, Concurrency: ${String(concurrency)})...`,
    );
    const goldenUserIds = new Map<string, string>();
    const userIds: string[] = [];
    const allPersonas = generate500Personas();

    // 1. Création des Golden Personas déterministes
    for (const persona of GOLDEN_PERSONAS) {
      try {
        const res = await lastValueFrom(
          this.userService.signUp(
            {
              email: persona.email,
              pseudo: persona.pseudo,
              password: persona.password,
            },
            baseMetadata,
          ),
        );

        if (res.user?.id) {
          const id = res.user.id;
          userIds.push(id);
          if (persona.focus) {
            goldenUserIds.set(persona.focus, id);
          }
          status.success++;
          await this.ensureSocialNode(id, baseMetadata);
          this.logger.log(
            `🌟 Golden user ready: ${persona.email} (${String(persona.focus)}) -> ${id}`,
          );
        } else {
          status.failed++;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(`Golden user ${persona.email} signup notice: ${msg}`);
        status.failed++;
      }
    }

    // 2. Création des autres profils de la base des 500 personas en parallèle
    const remainingCount = Math.max(0, targetCount - userIds.length);
    this.logger.log(
      `Generating ${String(remainingCount)} realistic volunteer profiles in batches...`,
    );

    const chunk = async (startIndex: number, batchSize: number) => {
      const promises = Array.from({ length: batchSize }).map(async (_, idx) => {
        const globalIdx = startIndex + idx;
        try {
          let email: string;
          let pseudo: string;
          const password = SEED_DEFAULT_PASSWORD;

          if (globalIdx < allPersonas.length) {
            const p = allPersonas[globalIdx];
            email = p.email;
            pseudo = p.pseudo;
          } else {
            email = faker.internet.email().toLowerCase();
            pseudo = `${faker.person.firstName()}${String(faker.number.int({ min: 10, max: 999 }))}`;
          }

          const res = await lastValueFrom(
            this.userService.signUp({ email, pseudo, password }, baseMetadata),
          );

          if (res.user?.id) {
            const id = res.user.id;
            userIds.push(id);
            status.success++;
            await this.ensureSocialNode(id, baseMetadata);
          } else {
            status.failed++;
          }
        } catch {
          status.failed++;
        }
      });
      await Promise.all(promises);
    };

    let processed = 0;
    while (processed < remainingCount) {
      const currentBatch = Math.min(concurrency, remainingCount - processed);
      await chunk(GOLDEN_PERSONAS.length + processed, currentBatch);
      processed += currentBatch;
      if (processed % 100 === 0 || processed === remainingCount) {
        this.logger.log(
          `Users progress: ${String(userIds.length)}/${String(targetCount)} created.`,
        );
      }
    }

    this.logger.log(`✅ Users seed complete: ${String(userIds.length)} users ready.`);
    return { goldenUserIds, userIds };
  }

  private async ensureSocialNode(userId: string, md: Metadata): Promise<void> {
    try {
      await lastValueFrom(this.socialUserNodeService.createUserNode({ userId }, md));
    } catch {
      // Ignorer si le nœud existe déjà ou est créé via outbox
    }
  }
}
