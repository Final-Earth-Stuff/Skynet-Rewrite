function discordProcessHandler() {
    return {
        addUserRole,
        setUserRole,
        removeUserRole,
        resolveRoleID,
    };

    async function addUserRole(xMsg, usr, roleName, roleID) {
        if (Array.isArray(roleName)) {
            roleID = await resolveRoleID(roleName, xMsg.guild);
        }
        if (roleID == null) {
            roleID = await resolveRoleID(roleName, xMsg.guild);
        }
        await usr.roles.add(roleID).catch();
    }

    async function setUserRole(xMsg, usr, roleName, roleID) {
        if (Array.isArray(roleName)) {
            roleID = await resolveRoleID(roleName, xMsg.guild);
        }
        if (roleID == null) {
            roleID = await resolveRoleID(roleName, xMsg.guild);
        }
        await usr.roles.set(roleID).catch();
    }

    async function removeUserRole(xMsg, usr, roleName, roleID) {
        if (Array.isArray(roleName)) {
            roleID = await resolveRoleID(roleName, xMsg.guild);
        }
        if (roleID == null) {
            roleID = await resolveRoleID(roleName, xMsg.guild);
        }
        await usr.roles.remove(roleID).catch();
    }

    function resolveRoleID(roleNameOrNames, xGld) {
        if (Array.isArray(roleNameOrNames)) {
            roleIDs = [];
            roleNameOrNames.forEach((roleName) => {
                roleIDs.push(resolveRoleID(roleName, xGld));
            });
            return roleIDs;
        }
        role = xGld.roles.cache.find((role) => {
            if (role.name === roleNameOrNames && role.deleted === false) {
                return role;
            }
        });
        return role.id;
    }
}

module.exports = discordProcessHandler();
