import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const requireUser = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return redirect("/auth/signin");
  }

  return session.user;
};
