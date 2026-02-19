import type {
  ConditionGroup,
  LeafCondition,
  ThresholdCondition,
  CrossCondition,
  PriceCondition,
  PositionCondition,
  Condition,
} from '@/types/strategy';
import { isConditionGroup, STRATEGY_LIMITS } from '@/types/strategy';

// ──────────────────────────────────────────────
// Default creators
// ──────────────────────────────────────────────

export function createDefaultGroup(): ConditionGroup {
  return { logic: 'AND', conditions: [] };
}

export function createDefaultThreshold(): ThresholdCondition {
  return {
    type: 'THRESHOLD',
    indicatorRef: null,
    field: '',
    operator: 'GT',
    value: 0,
  };
}

export function createDefaultCross(): CrossCondition {
  return {
    type: 'CROSS',
    indicatorRef: null,
    field: '',
    operator: 'CROSS_ABOVE',
    targetRef: null,
    targetField: null,
  };
}

export function createDefaultPrice(): PriceCondition {
  return {
    type: 'PRICE',
    indicatorRef: null,
    field: '',
    operator: 'GT',
    priceField: 'closePrice',
  };
}

export function createDefaultPosition(): PositionCondition {
  return {
    type: 'POSITION',
    field: 'changePercent',
    operator: 'LTE',
    value: -5,
  };
}

export function createDefaultLeaf(type: 'THRESHOLD' | 'CROSS' | 'PRICE' | 'POSITION'): LeafCondition {
  switch (type) {
    case 'THRESHOLD':
      return createDefaultThreshold();
    case 'CROSS':
      return createDefaultCross();
    case 'PRICE':
      return createDefaultPrice();
    case 'POSITION':
      return createDefaultPosition();
  }
}

// ──────────────────────────────────────────────
// Depth calculation
// ──────────────────────────────────────────────

export function getConditionDepth(node: Condition): number {
  if (!isConditionGroup(node)) return 0;
  if (node.conditions.length === 0) return 1;
  return 1 + Math.max(...node.conditions.map(getConditionDepth));
}

export function canAddNestedGroup(currentDepth: number): boolean {
  return currentDepth < STRATEGY_LIMITS.maxDepth;
}

// ──────────────────────────────────────────────
// Path-based immutable update
// ──────────────────────────────────────────────

export function updateAtPath(
  root: ConditionGroup,
  path: number[],
  updater: (node: Condition) => Condition | null,
): ConditionGroup {
  if (path.length === 0) {
    const result = updater(root);
    return (result as ConditionGroup) ?? createDefaultGroup();
  }

  const [index, ...rest] = path;
  const newConditions = [...root.conditions];

  if (rest.length === 0) {
    const result = updater(newConditions[index]);
    if (result === null) {
      newConditions.splice(index, 1);
    } else {
      newConditions[index] = result;
    }
  } else {
    const child = newConditions[index];
    if (isConditionGroup(child)) {
      newConditions[index] = updateAtPath(child, rest, updater);
    }
  }

  return { ...root, conditions: newConditions };
}

export function addAtPath(
  root: ConditionGroup,
  groupPath: number[],
  newChild: Condition,
): ConditionGroup {
  return updateAtPath(root, groupPath, (node) => {
    if (isConditionGroup(node)) {
      return { ...node, conditions: [...node.conditions, newChild] };
    }
    return node;
  });
}

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────

export function validateConditionTree(tree: ConditionGroup): string[] {
  const errors: string[] = [];

  function walk(node: Condition, depth: number) {
    if (isConditionGroup(node)) {
      if (node.conditions.length === 0) {
        errors.push('Empty condition group found');
      }
      if (depth > STRATEGY_LIMITS.maxDepth) {
        errors.push(`Max nesting depth (${STRATEGY_LIMITS.maxDepth}) exceeded`);
      }
      for (const child of node.conditions) {
        walk(child, depth + 1);
      }
    } else {
      switch (node.type) {
        case 'THRESHOLD':
          if (node.indicatorRef === null) errors.push('Threshold: indicator required');
          if (!node.field) errors.push('Threshold: field required');
          break;
        case 'CROSS':
          if (node.indicatorRef === null) errors.push('Cross: source indicator required');
          if (!node.field) errors.push('Cross: source field required');
          if (node.targetRef === null) errors.push('Cross: target indicator required');
          if (!node.targetField) errors.push('Cross: target field required');
          break;
        case 'PRICE':
          if (node.indicatorRef === null) errors.push('Price: indicator required');
          if (!node.field) errors.push('Price: field required');
          break;
        case 'POSITION':
          if (!node.field) errors.push('Position: field required');
          break;
      }
    }
  }

  walk(tree, 1);
  return errors;
}
