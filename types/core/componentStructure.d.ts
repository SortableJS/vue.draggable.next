export class ComponentStructure {
    constructor({ nodes: { header, default: defaultNodes, footer }, root, realList }: {
        nodes: {
            header: any;
            default: any;
            footer: any;
        };
        root: any;
        realList: any;
    });
    defaultNodes: any;
    children: any[];
    externalComponent: any;
    rootTransition: any;
    tag: any;
    realList: any;
    get _isRootComponent(): any;
    render(h: any, attributes: any): any;
    updated(): void;
    getUnderlyingVm(domElement: any): any;
    getVmIndexFromDomIndex(domIndex: any, element: any): any;
}
