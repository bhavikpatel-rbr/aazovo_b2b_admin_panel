export const getMenuRights = (menu: string) => {
    const useRights = JSON.parse(localStorage.getItem('@secure:Userpermission')) || {};
    const userData = JSON.parse(localStorage.getItem('@secure:UserData')) || {};
    const rights = useRights[menu] || {};

    return {
        is_add: userData?.role?.guard_name == 'admin' ? true : (rights.is_add || false),
        is_delete: userData?.role?.guard_name == 'admin' ? true : (rights.is_delete || false),
        is_edit: false,
        is_export: false,
        is_view: userData?.role?.guard_name == 'admin' ? true : (rights.is_view || false),
        useRights: useRights,
        userData: userData
    };
}