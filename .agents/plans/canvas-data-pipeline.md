# Canvas Data Pipeline — Widget Broadcast System

## Context

Messaging between terminals is the first instance of a broader pattern: **widgets pushing data through connectors to connected widgets at runtime**. This plan describes the general system that messaging fits into.

## The Pattern

Any widget can **produce output** and **consume input** through its connectors. The connector defines the broadcast mode and direction. Widgets declare what data they emit and what data they accept.

### Current: Messaging (terminal/agent widgets)
- Terminal A produces text output → pushed to Terminal B's input via tmux
- Mode set per-connector: none / one-way / two-way

### Future: Structured Data Broadcast
- Prompt widget produces structured output → pushed to connected prototype (overrides flow data)
- API widget fetches data → pushes JSON to connected widgets
- Compute widget transforms data → pushes result forward
- Any widget can be a producer, consumer, or both

## Connector Modes (revised)

### Messaging modes (per-widget, per-connector)

| Mode | Behavior | Shared? |
|------|----------|---------|
| **none** | No messaging (default) | Per-widget setting |
| **one-way →** | This widget can send to peer | Per-widget setting |
| **two-way ↔** | Both can send freely, auto-bridge active | Shared — setting on either side enables for both |

**One-way is directional per widget.** Widget A setting "one-way →" means A can send to B. Widget B independently decides whether to send back. If both set "one-way →", it's effectively two-way but without auto-bridge.

**Two-way is shared.** Either widget enabling "two-way" turns it on for both — it's a mutual agreement to have a continuous conversation.

### Data broadcast modes (future, per-connector)

| Mode | Behavior |
|------|----------|
| **pipe** | Producer pushes every output update to consumer automatically |
| **latest** | Consumer reads producer's latest output on demand |
| **trigger** | Producer's output triggers a computation in consumer |

## Widget Data Contract (future)

Widgets declare their data interface:

```json
{
  "type": "prompt",
  "dataContract": {
    "produces": {
      "type": "object",
      "description": "Prompt execution result",
      "schema": { "output": "string", "metadata": "object" }
    },
    "consumes": {
      "type": "object", 
      "description": "Input context",
      "schema": { "context": "string" }
    }
  }
}
```

### Prompt Widget Example

```
[Prompt Widget] --pipe--> [Prototype Widget]
     |                         |
     | produces: { output }    | consumes: { flowData override }
     |                         |
     └── User runs prompt ──→ output pushed as flow data override
                               to the connected prototype
```

The prompt widget:
1. User types a prompt, clicks "Run"
2. Widget executes (LLM call, API call, whatever)
3. Output saved to widget's `latestOutput` in canvas state
4. Connector has mode `pipe` → output automatically pushed to connected prototype
5. Prototype receives data as flow override → re-renders with new data
6. User runs prompt again → new output → pushed again → prototype updates

### Multi-hop Pipelines

```
[API Widget] --pipe--> [Transform Widget] --pipe--> [Prototype Widget]
     |                        |                           |
     | fetches JSON           | filters/maps data         | renders with data
```

Connectors form a DAG (directed acyclic graph). Data flows through the graph.

## What to Build Now vs Later

### Now (4.3.0 — messaging)
- ✅ Terminal messaging API (send, output, status)
- ✅ Connector messaging modes (none/one-way/two-way)  
- ✅ Skill injection on mode change
- 🔧 Fix: two-way is shared, one-way is per-widget
- 🔧 Support chains (A→B→C) and fan-out (A→B, A→C)

### Next (4.4.0 — data broadcast)
- Widget `latestOutput` as a first-class canvas concept (not just terminal config)
- Connector `broadcastMode`: pipe / latest / trigger
- Prompt widget as first non-terminal data producer
- Flow data override via connector pipe

### Later (5.0.0 — compute canvas)
- Widget data contracts (produces/consumes schemas)
- Type checking between connected widgets
- Visual data flow indicators on connectors
- Compute widgets (transform, filter, merge)
- Canvas-level execution engine (topological sort of widget DAG)

## Architecture Notes

### Where data lives
- **Widget output** → stored in canvas widget props (`latestOutput` field) or terminal config
- **Connector mode** → stored in connector `meta` object  
- **Data flow** → server-side: watches for output changes, pushes through connectors

### How push works
1. Widget writes output (via API endpoint or direct prop update)
2. Server detects output change on a widget with outgoing pipe connectors
3. Server resolves connected consumers
4. For each consumer: updates their input/override props with producer's output
5. HMR push → consumers re-render with new data

### How it connects to messaging
Messaging IS the first broadcast mode. `terminal send` = explicit push. `latestOutput` = passive read. Two-way auto-bridge = bidirectional pipe. The messaging API becomes a subset of the broader broadcast API.
