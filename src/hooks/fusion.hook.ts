import { FusionContext } from "@/contexts/fusion.context";
import { generateQueueFusions } from "@/services/fusion";
import { useCallback, useContext } from "preact/hooks";
import { useSimulator } from "./simulator.hook";
import { useFusionAnimate } from "./fusion-animate.hook";
import { useCards } from "./cards.hook";
import { CardEquipType, CardMonsterType, CardType } from "@/models/card.model";

export function useFusion() {
  const {
    fusing,
    index,
    queueFusions,
    setFusing,
    setIndex,
    setQueueFusions,
    reset,
  } = useContext(FusionContext);
  const { animate, moveOutUsedCards, clearCards } = useFusionAnimate();

  const { queueCards, hand, init } = useSimulator();
  const { findCardById } = useCards();

  const startFusion = useCallback(() => {
    if (fusing) {
      // Already fusing!
      return;
    }
    if (queueCards.length < 2) {
      console.error("At least two cards are needed for fusing");

      return;
    }

    // Set queue of fusions
    const queue = generateQueueFusions(findCardById, queueCards);
    setQueueFusions(queue);

    // Turn on fusing animation.
    setFusing(true);

    const fuseButton = document.getElementById("fuse-button");

    fuseButton!.style.opacity = "0";

    (async () => {
      // Set the first card as source
      let queueCardsIndex = 0;
      let source = queueCards[queueCardsIndex++];

      const cardsElements: HTMLElement[] = [];

      for (let i = 0; i < queue.length; i++) {
        const response = queue[i];
        let target = queueCards[queueCardsIndex++];

        cardsElements.push(
          ...moveOutUsedCards(
            hand
              .map((each, index) => ({
                ...each,
                index,
              }))
              .filter((each) => !each.priority)
          )
        );

        cardsElements.push(
          ...(await animate(
            source,
            target,
            hand
              .map((each, index) => ({
                ...each,
                index,
              }))
              .filter(
                (each, index) =>
                  source.id !== each.id &&
                  source.index !== index &&
                  target.id !== each.id &&
                  target.index !== index
              ),
            response.success,
            () => {
              setIndex(i);

              if (
                source.cardType === CardType.MONSTER &&
                target.cardType === CardType.EQUIP &&
                response.success
              ) {
                const modificationValue =
                  (target as CardEquipType).modificationValue ?? 0;

                // Bad practice

                const monster = response.result as CardMonsterType;

                if (monster.attack && !(monster as any)?.originalAttack) {
                  (monster as any).originalAttack = monster.attack;
                }

                if (monster.defense && !(monster as any)?.originalDefense) {
                  (monster as any).originalDefense = monster.defense;
                }

                monster.attack += modificationValue;
                monster.defense += modificationValue;
              }
            },
            i === 0
          ))
        );

        source = {
          ...response.result,
          // TODO: Check this index, maybe this can cause a conflict
          index: -1,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 2200));

      // Dispose

      clearCards(...cardsElements);

      // Reset all modified stats
      queue
        .map((each) => each.result)
        .forEach((card) => {
          if (card.cardType === CardType.MONSTER) {
            const monster = card as any as CardMonsterType;

            if ((monster as any).originalAttack) {
              monster.attack = (monster as any).originalAttack;
            }

            if ((monster as any).originalDefense) {
              monster.defense = (monster as any).originalDefense;
            }
          }
        });

      reset();

      init();

      fuseButton!.style.opacity = "100%";
    })();
  }, [setFusing, setQueueFusions, setIndex, queueCards, hand, fusing]);

  return {
    fusing,
    index,
    queueFusions,
    startFusion,
    setFusing,
  };
}
