import { notFound } from "next/navigation";
import CreateAccountClient from "./CreateAccountClient";

type SearchParamsPromise = Promise<
  Record<string, string | string[] | undefined>
>;

export default async function CreateAccountPage({
  searchParams,
}: {
  searchParams?: SearchParamsPromise;
}) {
  const resolved = (await searchParams) || {};

  const sessionIdRaw =
    (Array.isArray(resolved.session_id)
      ? resolved.session_id[0]
      : resolved.session_id) ||
    (Array.isArray(resolved.sessionId)
      ? resolved.sessionId[0]
      : resolved.sessionId) ||
    "";

  const successFlag = Array.isArray(resolved.success)
    ? resolved.success[0]
    : resolved.success;
  const canceledFlag = Array.isArray(resolved.canceled)
    ? resolved.canceled[0]
    : resolved.canceled;

  if (!sessionIdRaw && successFlag !== "true" && canceledFlag !== "true") {
    notFound();
  }

  return (
    <CreateAccountClient
      sessionId={sessionIdRaw}
      successFlag={successFlag}
      canceledFlag={canceledFlag}
    />
  );
}
