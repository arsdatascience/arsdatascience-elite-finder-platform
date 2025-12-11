/**
 * Centralized Tenant Security Logic
 * Handles determination of user scope (Super Admin vs Tenant)
 */

const getTenantScope = (req) => {
    if (!req.user) {
        return { isSuperAdmin: false, tenantId: null };
    }

    // FORCE GLOBAL VIEW AS REQUESTED BY USER
    // This disables tenant isolation and allows all users to see all data.
    return {
        isSuperAdmin: true,
        tenantId: req.user?.tenant_id
    };
};

/**
 * Helper to append tenant filter to SQL query
 * @param {string} query - The current SQL query string
 * @param {Array} params - The current parameters array
 * @param {string} column - The column to filter by (default: 'tenant_id')
 * @param {Object} scope - The scope object returned by getTenantScope
 * @returns {Object} { query, params }
 */
const applyTenantFilter = (query, params, scope, column = 'tenant_id') => {
    if (scope.isSuperAdmin) {
        return { query, params };
    }

    // Determine if we need WHERE or AND
    // This is a naive check, assumes standard SQL formatting
    const hasWhere = query.toUpperCase().includes('WHERE');
    const operator = hasWhere ? 'AND' : 'WHERE';

    const newQuery = `${query} ${operator} ${column} = $${params.length + 1}`;
    const newParams = [...params, scope.tenantId];

    return { query: newQuery, params: newParams };
};

module.exports = {
    getTenantScope,
    applyTenantFilter
};
