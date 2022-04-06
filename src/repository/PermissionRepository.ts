import { EntityRepository, Repository } from "typeorm";

import { Permission } from "../entity/Permission";

@EntityRepository(Permission)
export class PermissionRepository extends Repository<Permission> {}
