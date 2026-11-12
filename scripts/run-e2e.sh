#!/bin/sh
# E2E run of the api-gateway-e2e image (CMD of Dockerfile.e2e: `yarn test:e2e`), in two passes.
#
#   1. The suites in parallel (4 Jest workers), without e2e/faults/.
#   2. The suites of e2e/faults/ alone, in band: they cut a link between two services (Toxiproxy),
#      and a cut link is cut for every test running at that moment.
#
# Both passes always run, so a failure of the first does not hide the fault suites; the script
# fails when either pass failed.

yarn test:e2e:parallel
parallel_status=$?

yarn test:e2e:faults
faults_status=$?

if [ "$parallel_status" -ne 0 ]; then
  exit "$parallel_status"
fi
exit "$faults_status"
