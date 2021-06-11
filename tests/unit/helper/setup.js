window.ShadowRoot = Object;

function normalizeHTML(wrapper) {
    return wrapper.html().replace(/(\r\n|\n)/gm, "").replace(/>(\s)+</gm, "><");
};

function expectHTML(wrapper, expected) {
    const htmlStripped = normalizeHTML(wrapper);
    expect(htmlStripped).toEqual(expected);
}

export {
    expectHTML,
    normalizeHTML
}