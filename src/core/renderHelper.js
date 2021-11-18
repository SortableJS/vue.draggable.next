import { resolveComponent, TransitionGroup } from "vue";
import { isHtmlTag, isTransition } from "../util/tags";
import { ComponentStructure } from "./componentStructure";

function getSlot(slots, key) {
  const slotValue = slots[key];
  return slotValue ? slotValue() : [];
}

function getRealNode(rawNode) {
  let node = rawNode;
  let failed = false;
  while (!failed && node && !node.el) {
    const children = node.children;
    if (children && typeof children !== "string" && children.length === 1) {
      node = children[0];
    } else {
      failed = true;
    }
  }
  return node;
}

function computeNodes({ $slots, realList, getKey }) {
  const normalizedList = realList || [];
  const [header, footer] = ["header", "footer"].map(name =>
    getSlot($slots, name)
  );
  const { item } = $slots;
  if (!item) {
    throw new Error("draggable element must have an item slot");
  }
  const defaultNodes = normalizedList.flatMap((element, index) =>
    item({ element, index }).map(rawNode => {
      const node = getRealNode(rawNode);
      if (node) {
        node.key = getKey(element);
        node.props = { ...(node.props || {}), "data-draggable": true };
      }
      return node;
    })
  );
  if (defaultNodes.length !== normalizedList.length) {
    throw new Error("Item slot must have only one child");
  }
  return {
    header,
    footer,
    default: defaultNodes
  };
}

function getRootInformation(tag) {
  const transition = isTransition(tag);
  const externalComponent = !isHtmlTag(tag) && !transition;
  return {
    transition,
    externalComponent,
    tag: externalComponent
      ? resolveComponent(tag)
      : transition
      ? TransitionGroup
      : tag
  };
}

function computeComponentStructure({ $slots, tag, realList, getKey }) {
  const nodes = computeNodes({ $slots, realList, getKey });
  const root = getRootInformation(tag);
  return new ComponentStructure({ nodes, root, realList });
}

export { computeComponentStructure };
