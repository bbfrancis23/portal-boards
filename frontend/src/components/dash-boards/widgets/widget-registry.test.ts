import {expect, test} from "vitest"

import {WidgetRegistry} from "./widget-registry"
import type {WidgetDefinition} from "./widget-types"

const Empty = () => null

const stat: WidgetDefinition = {
  type: "stat",
  kind: "output",
  label: "Stat",
  component: Empty,
  defaultSize: {w: 3, h: 2},
}

const form: WidgetDefinition = {
  type: "form",
  kind: "input",
  label: "Form",
  component: Empty,
  defaultSize: {w: 6, h: 8},
}

test("looks up a registered widget by its type", () => {
  const registry = new WidgetRegistry()
  registry.register(stat)
  expect(registry.get("stat")).toBe(stat)
})

test("an unregistered type is undefined", () => {
  expect(new WidgetRegistry().get("stat")).toBeUndefined()
})

test("lists every widget, or only one kind", () => {
  const registry = new WidgetRegistry()
  registry.register(stat)
  registry.register(form)
  expect(registry.list()).toEqual([stat, form])
  expect(registry.list("input")).toEqual([form])
})

test("registering a different widget under the same type throws", () => {
  const registry = new WidgetRegistry()
  registry.register(stat)
  expect(() => registry.register({...stat, label: "Number"})).toThrow(/already registered/)
})

test("registering the same widget again keeps its newest component", () => {
  const registry = new WidgetRegistry()
  const Refreshed = () => null
  registry.register(stat)
  registry.register({...stat, component: Refreshed})
  expect(registry.get("stat")?.component).toBe(Refreshed)
})
