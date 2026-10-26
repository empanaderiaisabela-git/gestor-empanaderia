---
name: delegate-task
description: Use in the gestor-empanaderia repo when work can be handed to subagents — broad searches or reading many files, repetitive edits across files, several independent subtasks, or a hard isolated problem — or when the dev asks to delegate, use subagents or save cost. Picks the cheapest model tier that can do each piece (Haiku, Sonnet, Opus), escalates once on failure and verifies every result. Not for tasks doable in a few tool calls.
---

# delegate-task — delegar en subagentes según el costo

El dev autorizó (T-16) que esta skill lance subagentes sin pedirlo cada vez. Usa la herramienta Agent de Claude
Code; en otra herramienta, aplicá la misma clasificación con lo que tenga, o hacé la tarea directo.

## 1. ¿Conviene delegar?

No delegues si:

- se resuelve en 3 llamadas a herramientas o menos;
- depende de mucho contexto de esta conversación (el subagente arranca de cero y lo tendría que reconstruir);
- es commit, push, merge, borrar ramas, comandos sobre la base o tocar `.env`: eso lo hace sólo el agente
  principal, con el OK del dev.

## 2. Partir y clasificar

Partí el trabajo en subtareas con un resultado verificable. A cada una, el nivel más bajo que pueda hacerla bien:

| Nivel | `model` | `effort` | Cuándo |
|---|---|---|---|
| 1 · barato | `haiku` | `low` | Mecánico y fácil de verificar: buscar dónde está algo, leer y resumir archivos, logs o salidas de tests, listar usos, cambios repetitivos con instrucciones exactas, correr un comando y reportar. |
| 2 · medio | `sonnet` | `medium` | Implementación acotada con instrucciones claras: tests de un comportamiento definido, una función o componente de un plan aprobado, un bug de causa conocida, refactor local, revisar un diff chico. |
| 3 · caro | `opus` | `high` | Requiere juicio: bug sin causa conocida (tests intermitentes, concurrencia), diseño o arquitectura, revisión de seguridad, cambios que cruzan capas, o lo que falló en el nivel 2. |

- Sólo esos tres modelos. Opus es el techo: ningún otro, ni siquiera al escalar.
- Ante la duda entre dos niveles: el de abajo si el resultado es fácil de verificar; el de arriba si un error
  sería caro de detectar.
- Referencia (USD por millón de tokens, entrada/salida): Haiku 5.5 0,10/0,50 · Sonnet 5.5 2/10 · Opus 5.5 4/20.

## 3. Elegir el tipo de agente

| Subtarea | `subagent_type` |
|---|---|
| Sólo buscar o leer | `Explore` |
| Diseñar un plan sin editar | `Plan` |
| Editar archivos o correr comandos | `general-purpose` |

Pasá siempre `model` y `effort` en cada llamada: esta skill lo pide explícitamente. Nunca uses `fork` para
abaratar: ignora `model` y corre con el modelo del agente principal.

## 4. Escribir el pedido

Cada subagente arranca sin contexto. El prompt lleva:

1. Objetivo y qué significa "terminado".
2. Archivos o rutas exactas, y lo ya averiguado que le ahorre buscar.
3. Si edita: "Respetá `AGENTS.md`" y las reglas duras que apliquen (100 líneas por archivo, cero comentarios,
   capas, sin `any`).
4. Qué no hacer: nada fuera del alcance, sin commits ni comandos sobre la base.
5. Formato de respuesta: breve, con rutas `archivo:línea` y lo que cambió.

Las subtareas independientes van en paralelo (varias llamadas en un mismo mensaje). Si dos tocan el mismo archivo,
van en serie.

## 5. Verificar y escalar

- Revisá cada resultado antes de usarlo: leé el diff y corré el lint o los tests de lo que tocó.
- Si es incompleto o incorrecto, reintentá **una vez** en el nivel siguiente, con lo que falló en el pedido. No
  repitas en el mismo nivel.
- Si falla en el nivel 3, frená y contale al dev.

## 6. Informar al dev

Al terminar, una tabla breve: subtarea · nivel · resultado (y si se escaló). El dev no ve el informe de cada
subagente: contale lo que importa.
