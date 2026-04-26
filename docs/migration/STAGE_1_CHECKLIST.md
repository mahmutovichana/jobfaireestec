# Stage 1 Checklist - Architecture and Execution Lock

## Goal

Lock the migration direction before implementation changes.

## Done in this stage

- [x] Defined migration stages and commit strategy.
- [x] Defined rollback and tagging approach.
- [x] Defined mandatory user inputs before Stage 2.

## Next stage entry criteria

All items below must be confirmed:

- [ ] Opalstack backend app type
- [ ] Opalstack PostgreSQL database details
- [ ] Email provider selection
- [ ] AI provider selection
- [ ] Staging domain decision

## Commit and push protocol

For every stage:

1. `git add -A`
2. `git commit -m "stage-N: <short description>"`
3. `git push origin main`
4. `git tag migration-stage-N`
5. `git push origin migration-stage-N`
