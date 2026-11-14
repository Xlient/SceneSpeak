import type { AuthStatus } from "../auth/auth-state";

/** Profile photo for Google users, an initial otherwise. Decorative: the name is always shown nearby. */
export const Avatar = ({ status, size = "small" }: { status: AuthStatus; size?: "small" | "large" }) => {
  const user = status.kind === "member" || status.kind === "guest" ? status.user : undefined;
  if (user?.photoURL) {
    return <img className={`avatar ${size}`} src={user.photoURL} alt="" referrerPolicy="no-referrer" />;
  }
  const initial = status.kind === "member" ? (user?.displayName?.trim()[0] ?? "★") : "🙂";
  return (
    <span className={`avatar ${size} initial`} aria-hidden="true">
      {initial.toLocaleUpperCase()}
    </span>
  );
};
