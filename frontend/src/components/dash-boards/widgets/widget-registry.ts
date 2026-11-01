import type {WidgetDefinition, WidgetKind} from "./widget-types"

// The fields that stay the same when the same widget registers again. `component` is left out:
// Fast Refresh re-runs a widget's registration with a fresh function for the same component.
// JSON.stringify is enough for defaultConfig, since a re-registration comes from the same source.
const definitionsMatch = (a: WidgetDefinition, b: WidgetDefinition) =>
  a.kind === b.kind &&
  a.label === b.label &&
  a.defaultSize.w === b.defaultSize.w &&
  a.defaultSize.h === b.defaultSize.h &&
  JSON.stringify(a.defaultConfig) === JSON.stringify(b.defaultConfig)

// Widget types register themselves once (see index.ts); the canvas looks each widget up by type.
export class WidgetRegistry {
  private definitions = new Map<string, WidgetDefinition>()

  register(definition: WidgetDefinition): void {
    const existing = this.definitions.get(definition.type)
    // A different definition under the same type means two widgets collide, so fail loudly.
    if (existing && !definitionsMatch(existing, definition)) {
      throw new Error(
        `Widget type "${definition.type}" is already registered with a different definition`,
      )
    }
    // Always store the new one, so a Fast Refresh re-registration picks up its fresh component.
    this.definitions.set(definition.type, definition)
  }

  get(type: string): WidgetDefinition | undefined {
    return this.definitions.get(type)
  }

  list(kind?: WidgetKind): WidgetDefinition[] {
    const all = Array.from(this.definitions.values())
    return kind ? all.filter((definition) => definition.kind === kind) : all
  }
}

export const widgetRegistry = new WidgetRegistry()
