import { useStorage } from "@/hooks/storage.hook";
import { useRouter } from "preact-router";
import { useMemo } from "preact/hooks";
import { GroupFull } from "../organisms/GroupFull";
import { NotFound } from "../atoms/NotFound";
import { useData } from "@/hooks/data.hook";
import { DynamicHead } from "../molecules/Helmet";

export function GroupPage() {
  const [
    {
      // "id" could be an ID and a same
      matches: { id },
    },
  ] = useRouter() as any;

  if (!id) {
    return <></>;
  }

  const { groups } = useStorage();
  const { groups: defaultGroups } = useData();

  const allGroups = useMemo(
    () => [
      ...groups.map((each) => ({ ...each, editable: true })),
      ...defaultGroups,
    ],
    [groups, defaultGroups]
  );

  const findGroup = useMemo(
    () => allGroups.find((each) => each.id === id),
    [allGroups]
  );

  if (!findGroup) {
    return <NotFound />;
  }

  return (
    <>
      <DynamicHead
        titlePrefix={`${findGroup.name}`}
        description={`A group of ${findGroup.cards.length} cards`}
        keywords={findGroup.cards
          .map((each) => `card-[${each}]`)
          .join(",")
          .slice(0, 200)}
      />
      <main className={"!max-w-[960px]"}>
        <GroupFull group={findGroup} />
      </main>
    </>
  );
}
