import { isHtmlTag, isTransition, isHtmlAttribute } from "@/util/tags";

describe("isHtmlTag", () => {
  test.each([
    ["div", true],
    ["ul", true],
    ["li", true],
    ["a", true],
    ["keep-alive", false],
    ["not an element", false],
  ])(
    "for %s returns %s",
    (value, expected) =>{
      const actual = isHtmlTag(value);
      expect(actual).toEqual(expected);
    }
  )
});

describe("isHtmlAttribute", () => {
  test.each([
    ["class", true],
    ["id", true],
    ["role", true],
    ["data-whatever", true],
    ["aria-whatever", true],
    ["onclick", true],
    ["onAnything", true],
    ["style", true],
    ["notattribute", false],
    ["href", false],
    ["name", false],
  ])(
    "for %s returns %s",
    (value, expected) =>{
      const actual = isHtmlAttribute(value);
      expect(actual).toEqual(expected);
    }
  )
});

describe("isTransition", () => {
  test.each([
    ["TransitionGroup", true],
    ["transition-group", true],
    ["transition", false],
    ["div", false],
    ["li", false]
  ])(
    "for %s returns %s",
    (value, expected) =>{
      const actual = isTransition(value);
      expect(actual).toEqual(expected);
    }
  )
});
