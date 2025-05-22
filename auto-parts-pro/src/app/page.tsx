import { HydrateClient } from "@/trpc/server";

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });

  // void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <div>
        <h1>Auto Parts Pro</h1>
      </div>
    </HydrateClient>
  );
}
