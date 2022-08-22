import { AppDataSource } from "../";
import { UserRank } from "../entity/UserRank";

export const UserRankRepository = AppDataSource.getRepository(UserRank).extend({
    getCurrentUsers(): Promise<UserRank[]> {
        return this.manager
            .createQueryBuilder(UserRank, "user")
            .where("array_length(guild_ids, 1) >= 1")
            .getMany();
    },
    updateNameAndRank(id: string, rank: number, name: string) {
        return this.manager.update(
            UserRank,
            { discord_id: id },
            {
                user_name: name,
                rank: rank,
            }
        );
    },
    findByDiscordId(id: string): Promise<UserRank | null> {
        return this.manager.findOne(UserRank, {
            where: { discord_id: id },
        });
    },
});
