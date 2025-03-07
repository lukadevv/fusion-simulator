import { useFusion } from "@/hooks/fusion.hook";
import { CardUnknown } from "./CardUnknown";
import { Card } from "../molecules/Card";

export function CardResult() {
  const { queueFusions, index } = useFusion();

  if (index === -1 || !queueFusions[index]) {
    return <CardUnknown />;
  }

  const result = queueFusions[index].result;

  return <Card {...result} index={-1}></Card>;
}
