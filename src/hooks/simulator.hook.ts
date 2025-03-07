import { useCallback, useContext, useMemo } from "preact/hooks";
import { PriorityType, SimulatorContext } from "../contexts/simulator.context";
import { generateHand } from "../services/randomize";
import { GroupType } from "../models/group.model";
import { useStorage } from "./storage.hook";
import { CardBaseType } from "@/models/card.model";
import { unselectGroups } from "@/services/pool";

export function useSimulator() {
  const { simulator, toggleSpeed, togglePrediction, isPredictionEnabled } =
    useStorage();
  const { hand, setHand, cards, setCards, resets, setResets } =
    useContext(SimulatorContext);
  const queueCards = useMemo<
    (CardBaseType & {
      index: number;
    })[]
  >(
    () =>
      hand
        .map((each, index) => ({
          ...each,
          index,
        }))
        .filter((each) => each.priority)
        .sort((a, b) => a.priority! - b.priority!),
    [hand]
  );

  const setFocusCard = useCallback(
    (handIndex: number) => {
      setHand(
        hand
          .map((each) => ({
            ...each,
            focus: false,
          }))
          .map((each, index) =>
            index === handIndex
              ? {
                  ...each,
                  focus: true,
                }
              : each
          )
      );
    },
    [setHand, hand]
  );

  const focusCard = useMemo(() => {
    const find = hand.find((each) => each.focus);

    if (hand.length < 1) {
      return;
    }

    if (!find) {
      setFocusCard(0);

      return hand[0];
    }

    return find;
  }, [hand]);

  const focusCardIndex = useMemo(() => {
    const find = hand.findIndex((each) => each.focus);

    if (hand.length < 1) {
      return;
    }

    if (find < 0) {
      setFocusCard(0);

      return 0;
    }

    return find;
  }, [hand]);

  const resetHand = useCallback(() => {
    setHand(generateHand(cards));

    setResets(resets + 1);
  }, [setCards, generateHand, cards, resets, setResets]);

  const init = useCallback(() => {
    // Initialize the simulator
    setResets(0);

    // Set the hand
    resetHand();
  }, [resetHand]);

  const selectHandCard = useCallback(() => {
    const cardIndex = hand.findIndex((each) => each.focus);
    const card = hand[cardIndex];

    if (!card) {
      return;
    }

    const handClone = [...hand];

    if (card.priority) {
      // Remove priority
      handClone[cardIndex] = {
        ...handClone[cardIndex],
        priority: undefined,
      };

      // Reassign priorities to keep order consistent
      const prioritizedCards = handClone
        .filter((each) => each.priority)
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

      // Update priorities sequentially
      prioritizedCards.forEach((each, index) => {
        each.priority = (index + 1) as PriorityType;
      });
    } else {
      // Assign a new priority (next available number)
      const nextPriority =
        hand.filter((each) => each.priority !== undefined).length + 1;

      handClone[cardIndex] = {
        ...handClone[cardIndex],
        priority: nextPriority as PriorityType,
      };
    }

    setHand(handClone);
  }, [hand, setHand]);

  const unselectPool = useCallback(
    (pool: GroupType) => {
      if (simulator.groups.length <= 1) {
        // At least one is needed
        return;
      }

      unselectGroups(pool);
    },
    [unselectGroups, simulator]
  );

  return {
    hand,
    setCards,
    resetHand,
    selectHandCard,
    init,
    unselectPool,
    focusCard,
    focusCardIndex,
    setFocusCard,
    queueCards,
    toggleSpeed,
    togglePrediction,
    speed: simulator.settings.speed,
    resets,
    isPredictionEnabled,
  };
}
