import { EL } from "./el";

export enum ContainerType {
    // eslint-disable-next-line no-unused-vars
    ROOT = "ROOT",
    // eslint-disable-next-line no-unused-vars
    TOPLEVEL = "TOPLEVEL",
    // eslint-disable-next-line no-unused-vars
    ARTICLES = "ARTICLES",
    // eslint-disable-next-line no-unused-vars
    SPANS = "SPANS",
}


interface IterableIterator<T> extends Iterator<T, void, undefined> {
    [Symbol.iterator](): IterableIterator<T>;
}
export class Container {
    public el: EL;
    public type: ContainerType;
    public spanRange: [number, number]; // half open
    public parent: Container | null;
    public children: Container[];

    public subParent: Container | null;
    public subChildren: Container[];

    constructor(
        el: EL,
        type: ContainerType,
        spanRange: [number, number] = [NaN, NaN],
        parent: Container | null = null,
        children: Container[] = [],
        subParent: Container | null = null,
        subChildren: Container[] = [],
    ) {
        this.el = el;
        this.type = type;
        this.spanRange = spanRange;
        this.parent = parent;
        this.children = children;
        this.subParent = subParent;
        this.subChildren = subChildren;
    }

    public addChild(child: Container): Container {
        this.children.push(child);
        child.parent = this;
        if (child.type !== ContainerType.ARTICLES) {
            const subParent = this.type !== ContainerType.ARTICLES
                ? this
                : this.closest(container => container.type !== ContainerType.ARTICLES);
            if (!subParent) throw new Error();
            subParent.subChildren.push(child);
            child.subParent = subParent;
        }
        return this;
    }

    public thisOrClosest(func: (container: Container) => boolean): Container | null {
        if (func(this)) return this;
        return this.parents(func).next().value || null;
    }

    public closest(func: (container: Container) => boolean): Container | null {
        return this.parents(func).next().value || null;
    }

    public *parents(func?: (container: Container) => boolean): IterableIterator<Container> {
        if (!this.parent) return;
        if (!func || func(this.parent)) yield this.parent;
        yield* this.parent.parents(func);
    }

    public linealAscendant(func?: (container: Container) => boolean): Container[] {
        const ret = [...this.parents(func)].reverse();
        if (!func || func(this)) ret.push(this);
        return ret;
    }

    public findAncestorChildren(func: (container: Container) => boolean): Container | null {
        return this.ancestorChildren(func).next().value || null;
    }

    public *ancestorChildren(func: (container: Container) => boolean): IterableIterator<Container> {
        if (!this.parent) return;
        yield* this.parent.children.filter(func);
        yield* this.parent.ancestorChildren(func);
    }

    public next(func: (container: Container) => boolean): Container | null {
        return this.nextAll(func).next().value || null;
    }

    public *nextAll(func: (container: Container) => boolean): IterableIterator<Container> {
        if (!this.parent) return;
        for (let i = this.parent.children.indexOf(this) + 1; i < this.parent.children.length; i++) {
            const sibling = this.parent.children[i];
            if (func(sibling)) yield sibling;
        }
    }

    public prev(func: (container: Container) => boolean): Container | null {
        return this.prevAll(func).next().value || null;
    }

    public *prevAll(func: (container: Container) => boolean): IterableIterator<Container> {
        if (!this.parent) return;
        for (let i = this.parent.children.indexOf(this) - 1; 0 <= i; i--) {
            const sibling = this.parent.children[i];
            if (func(sibling)) yield sibling;
        }
    }

    public thisOrClosestSub(func: (container: Container) => boolean): Container | null {
        if (func(this)) return this;
        return this.parentsSub(func).next().value || null;
    }

    public closestSub(func: (container: Container) => boolean): Container | null {
        return this.parentsSub(func).next().value || null;
    }

    public *parentsSub(func: (container: Container) => boolean): IterableIterator<Container> {
        if (!this.subParent) return;
        if (func(this.subParent)) yield this.subParent;
        yield* this.subParent.parentsSub(func);
    }

    public findAncestorChildrenSub(func: (container: Container) => boolean): Container | null {
        return this.ancestorChildrenSub(func).next().value || null;
    }

    public *ancestorChildrenSub(func: (container: Container) => boolean): IterableIterator<Container> {
        if (!this.subParent) return;
        yield* this.subParent.subChildren.filter(func);
        yield* this.subParent.ancestorChildrenSub(func);
    }

    public nextSub(func: (container: Container) => boolean): Container | null {
        return this.nextAllSub(func).next().value || null;
    }

    public *nextAllSub(func: (container: Container) => boolean): IterableIterator<Container> {
        if (!this.subParent) return;
        for (let i = this.subParent.subChildren.indexOf(this) + 1;
            i < this.subParent.subChildren.length; i++) {
            const sibling = this.subParent.subChildren[i];
            if (func(sibling)) yield sibling;
        }
    }

    public prevSub(func: (container: Container) => boolean): Container | null {
        return this.prevAllSub(func).next().value || null;
    }

    public *prevAllSub(func: (container: Container) => boolean): IterableIterator<Container> {
        if (!this.subParent) return;
        for (let i = this.subParent.subChildren.indexOf(this) - 1; 0 <= i; i--) {
            const sibling = this.subParent.subChildren[i];
            if (func(sibling)) yield sibling;
        }
    }

    public find(
        func?: (container: Container) => boolean,
        cut?: (container: Container) => boolean,
    ): Container | null {
        return this.findAll(func, cut).next().value || null;
    }

    public *findAll(
        func?: (container: Container) => boolean,
        cut?: (container: Container) => boolean,
    ): IterableIterator<Container> {
        for (const child of this.children) {
            if (cut && cut(child)) return;
            if (!func || func(child)) yield child;
            yield* child.findAll(func, cut);
        }
    }

    public *iterate(
        func?: (container: Container) => boolean,
        cut?: (container: Container) => boolean,
    ): IterableIterator<Container> {
        if (cut && cut(this)) return;
        if (!func || func(this)) yield this;
        for (const child of this.children) yield* child.iterate(func, cut);
    }

    public *iterateReverse(
        func?: (container: Container) => boolean,
        cut?: (container: Container) => boolean,
    ): IterableIterator<Container> {
        if (cut && cut(this)) return;
        for (let i = this.children.length - 1; 0 <= i; i--) {
            const child = this.children[i];
            yield* child.iterateReverse(func, cut);
        }
        if (!func || func(this)) yield this;
    }
}
