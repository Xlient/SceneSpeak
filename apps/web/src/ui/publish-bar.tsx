import { useState } from "react";
import type { AuthStatus } from "@scenespeak/core/auth/auth-state";
import type { GeneratedLesson } from "@scenespeak/core/lesson/generator";
import { toPublishDoc } from "@scenespeak/core/library/library";
import type { Intent } from "@scenespeak/core/schemas";
import { NotConnectedError } from "@scenespeak/core/services/not-connected";
import { useServices } from "./services-context";

export interface PublishBarProps {
  auth: AuthStatus;
  lesson: GeneratedLesson;
  topic: string;
  intents: readonly Intent[];
  onSignIn?: (() => void) | undefined;
}

type State = { status: "idle" } | { status: "busy" } | { status: "done" } | { status: "failed"; message: string };

/** Offers to share a freshly generated lesson in the public library. */
export const PublishBar = ({ auth, lesson, topic, intents, onSignIn }: PublishBarProps) => {
  const { library } = useServices();
  const [state, setState] = useState<State>({ status: "idle" });

  const publish = async () => {
    if (auth.kind !== "member") return;
    setState({ status: "busy" });
    try {
      await library.publish(toPublishDoc({ lesson, topic, intents, authorUid: auth.user.uid, authorDisplayName: auth.user.displayName }));
      setState({ status: "done" });
    } catch (error) {
      setState({ status: "failed", message: error instanceof NotConnectedError ? error.message : "Couldn't share the lesson. Try again." });
    }
  };

  return (
    <div className="card publish-bar" role="region" aria-label="Share this lesson">
      {state.status === "done" ? (
        <p role="status">✓ Shared! It's in the lesson library on the Community page.</p>
      ) : (
        <>
          <p>
            <strong>Like this lesson?</strong> Share it in the library so others can play and upvote it. Only your first name is shown.
          </p>
          {auth.kind === "member" ? (
            <button type="button" className="small" disabled={state.status === "busy"} onClick={() => void publish()}>
              {state.status === "busy" ? "Sharing…" : "Share to library"}
            </button>
          ) : (
            onSignIn && (
              <button type="button" className="small" onClick={onSignIn}>
                Sign in with Google to share
              </button>
            )
          )}
          {state.status === "failed" && (
            <p className="error" role="alert">
              {state.message}
            </p>
          )}
        </>
      )}
    </div>
  );
};
