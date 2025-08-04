export const getMenuRights = (menu: string) => {
    const useRights = JSON.parse(localStorage.getItem('@secure:Userpermission')) || {};
    const rights = useRights[menu] || {};

    return {
        is_add: rights.is_add || false,
        is_delete: rights.is_delete || false,
        is_edit: rights.is_edit || false,
        is_export: rights.is_export || false,
        is_view: rights.is_view || false,
        useRights: useRights
    };
}