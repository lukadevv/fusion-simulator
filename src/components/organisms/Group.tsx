import { useCallback, useMemo, useState } from "preact/hooks";
import { Card as UICard, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Edit3, Trash } from "lucide-react";
import { deleteGroup, updateGroup } from "@/services/group";
import { GroupType } from "@/models/group.model";
import { findCardById } from "@/services/finder";
import { IdType } from "@/models/card.model";
import { MiniCard } from "../molecules/MiniCard";
import { Switch } from "../atoms/Switch";
import { selectGroups, unselectGroups } from "@/services/pool";
import { useStorage } from "@/hooks/storage.hook";
import { useRouter } from "preact-router";
import { appendUrlPath } from "@/utils/path";
import { cn } from "@/lib/utils";

export function Group({
  group,
}: {
  group: GroupType & {
    editable?: boolean;
  };
}) {
  const { id, name, cards, editable } = group;

  const [edit, setEdit] = useState(false);
  const allCards = useMemo(
    () => cards.map((id) => findCardById(id as IdType)!),
    [cards]
  );

  const showCards = 22;

  const otherCards = useMemo(() => allCards.length - showCards, [allCards]);

  const reducedView = useMemo(() => otherCards > 0, [otherCards]);

  const viewCards = useMemo(
    () => (reducedView ? allCards.slice(0, showCards - 1) : allCards),
    [allCards, reducedView]
  );

  const {
    simulator: { groups },
  } = useStorage();

  const selected = useMemo(
    () => groups.some((each) => each.id === id),
    [groups]
  );

  const [, push] = useRouter();

  const select = useCallback(() => {
    selectGroups(group);

    const element = document.getElementById("groups-section");
    if (element) {
      push("?page=1");
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [push, selectGroups, id]);

  const [newName, setNewName] = useState<string>(group.name);

  return (
    <UICard className={selected ? "bg-card border-amber-200" : "bg-background"}>
      <CardHeader>
        <CardTitle
          className={
            "relative flex items-center gap-4 border-b-2 pb-4 animate-in animate-bounce font-light"
          }
        >
          {edit ? (
            <Input
              defaultValue={name}
              onChange={(event) => setNewName((event.target as any)?.value!)}
              className={"w-fit"}
            />
          ) : (
            <a
              href={appendUrlPath(`/groups/${id}`)}
              className={
                "text-xl uppercase hover:text-amber-200 transition-all hover:underline"
              }
            >
              {name} ({allCards.length})
            </a>
          )}
          {editable && (
            <div className={"flex gap-1"}>
              <Button
                variant={"outline"}
                onClick={() => {
                  if (edit) {
                    updateGroup({
                      id,
                      name: newName ?? group.name,
                    });
                    setEdit(false);
                  } else {
                    setEdit(true);
                  }
                }}
                aria-label={"Edit name"}
                className={cn(
                  edit &&
                    ((newName?.length ?? 0) > 0 ? "bg-green-800" : "bg-red-800")
                )}
                disabled={(newName?.length ?? 0) <= 0}
              >
                <Edit3 />
              </Button>
              <Button
                variant={"outline"}
                onClick={() => deleteGroup(id)}
                aria-label={"Remove group"}
              >
                <Trash />
              </Button>
            </div>
          )}
          <div
            class={"absolute"}
            style={{
              left: "100%",
              transform: "translate(-100%,-100%)",
              top: "50%",
            }}
          >
            <Switch
              checked={selected}
              setChecked={() => (selected ? unselectGroups(group) : select())}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent
        className={
          "grid grid-cols-11 gap-2 max-[1040px]:grid-cols-10 max-[970px]:grid-cols-9 max-[785px]:grid-cols-8 max-[700px]:grid-cols-7 max-[615px]:grid-cols-6 max-[530px]:grid-cols-5 max-[451px]:grid-cols-4 max-[380px]:grid-cols-3 max-[305px]:grid-cols-2 max-[234px]:grid-cols-1 m-auto"
        }
      >
        {viewCards.map((each, index) => (
          <MiniCard key={`${each}-${index}`} {...each} />
        ))}
        {reducedView && (
          <a href={appendUrlPath(`/groups/${id}`)}>
            <div
              className={
                "flex bg-slate-600 h-[90px] w-[72px] text-3xl border rounded-sm hover:text-yellow-600 hover:bg-slate-700 hover:scale-[1.05] transition-all cursor-pointer"
              }
            >
              <p className={"m-auto"}>+{otherCards + 1}</p>
            </div>
          </a>
        )}
      </CardContent>
    </UICard>
  );
}
