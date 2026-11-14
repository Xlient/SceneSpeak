import type { AuthClient } from "../auth/auth-client";
import { describeAccount } from "../auth/auth-state";
import { useAuth } from "./use-auth";

export const AccountButton = ({ client }: { client: AuthClient }) => {
  const { status, busy, error, signInWithGoogle, signOut } = useAuth(client);
  const view = describeAccount(status);
  const onAction = { google: signInWithGoogle, "sign-out": signOut };

  return (
    <div className="account">
      <span className="pill account-pill">
        <span aria-hidden="true">{status.kind === "member" ? "🌟" : "🙂"}</span>
        <span className="visually-hidden">Account: </span>
        {view.label}
      </span>
      {view.action && (
        <button type="button" className="small" disabled={busy} onClick={onAction[view.action.kind]}>
          {view.action.text}
        </button>
      )}
      <span className="account-error" role="status" aria-live="polite">
        {error}
      </span>
    </div>
  );
};
