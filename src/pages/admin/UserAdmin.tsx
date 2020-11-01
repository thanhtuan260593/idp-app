import { useReactOidc } from "@axa-fr/react-oidc-context";
import { Breadscrumbs, newBreadscrumb } from "components/Core";
import { UserSelect } from "components/User/UserSelect";
import { Layout2 } from "components/Layout/Layout2";
import React from "react";
import { userAPI } from "resources/apis/user";
import { IUser } from "resources/models/user";
import { routes } from "routes";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
import { LayoutContext } from "components/Layout/PageLayout";
import { User } from "oidc-client";
import { IRole } from "resources/models/role";
import { RequestError } from "resources/apis/api";
import { ErrorMessage } from "components/Core/ErrorMessage";
interface UserLayoutContextProps {
  users: IUser[];
  roles: IRole[];
  user?: IUser;
  refreshUser: () => void;
  onUserChange: React.Dispatch<React.SetStateAction<IUser | undefined>>;
  setUsers: React.Dispatch<React.SetStateAction<IUser[]>>;
  setRoles: React.Dispatch<React.SetStateAction<IRole[]>>;
}
type TParams = { id: string };
export const UserLayoutContext = React.createContext<UserLayoutContextProps>({
  roles: [],
  users: [],
  refreshUser: () => {},
  onUserChange: () => {},
  setUsers: () => [],
  setRoles: () => [],
});
const initialLoad = async (oidcUser: User) => {
  const users = await userAPI.list(oidcUser, 0, 100, "id", 1);
  const roles = await userAPI.getRoles(oidcUser);
  return { users, roles };
};
export const UserAdmin = (props: RouteComponentProps<TParams>) => {
  return <UserAdminWrapped {...props} />;
};

const UserAdminWrapped = ({ match }: RouteComponentProps<TParams>) => {
  const [users, setUsers] = React.useState<IUser[]>([]);
  const [user, setUser] = React.useState<IUser>();
  const [roles, setRoles] = React.useState<IRole[]>([]);
  const [error, setError] = React.useState<RequestError>();
  const { oidcUser } = useReactOidc();
  const { setBreadscrumbs } = React.useContext(LayoutContext);
  React.useEffect(() => {
    if (oidcUser == null) return;
    initialLoad(oidcUser).then(({ users, roles }) => {
      setUsers(users);
      setRoles(roles);
    });
  }, [oidcUser]);
  const refreshUser = React.useCallback(() => {
    if (match?.params?.id == null || oidcUser == null) return;
    const id = match.params.id;
    userAPI
      .get(oidcUser, id)
      .then((changed) => {
        setUser(changed);
        setUsers((users) =>
          users.map((user) => (user.id === changed.id ? changed : user))
        );
      })
      .catch(setError);
  }, [oidcUser, match]);
  React.useEffect(() => {
    setUser(undefined);
    refreshUser();
  }, [refreshUser]);
  const breadscrumbs = React.useMemo(() => {
    const bs = [
      newBreadscrumb(routes.UsersRoute),
      ...(user
        ? [
            {
              text: user.username,
              href: routes.UserViewRoute.getPath(user.id),
              active: true,
            },
          ]
        : []),
    ];

    return bs;
  }, [user]);
  React.useEffect(() => {
    setBreadscrumbs(breadscrumbs);
  }, [setBreadscrumbs, breadscrumbs]);
  if (error != null) return <ErrorMessage {...error} />;
  return (
    <UserLayoutContext.Provider
      value={{
        users,
        roles,
        user,
        refreshUser,
        setUsers,
        setRoles,
        onUserChange: setUser,
      }}
    >
      <div className="flex flex-col h-full">
        <div className="hidden pb-2 pl-5 sm:block">
          <Breadscrumbs breadscrumbs={breadscrumbs} />
        </div>
        <div className="flex flex-1">
          <Layout2
            left={<UserSelect users={users} selected={user} />}
            main={
              <Switch>
                <Route
                  path={routes.UserViewRoute.path}
                  exact
                  render={routes.UserViewRoute.render}
                />
                <Route
                  path={routes.UserCreateRoute.path}
                  exact
                  component={routes.UserCreateRoute.render}
                />
              </Switch>
            }
          />
        </div>
      </div>
    </UserLayoutContext.Provider>
  );
};
