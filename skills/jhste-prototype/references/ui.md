# UI Prototype Guidance

Use this reference only when the question is about layout, information hierarchy, interaction flow, or the primary affordance of a user interface.

## Prototype in real context

Prefer an existing product surface with realistic data density, navigation, permissions, and surrounding content. Create a prototype-only route only when no existing surface can host the question without distorting it.

Keep existing data loading and environmental context where safe. Stub mutations and externally visible actions unless their behavior is the question.

## Expose consequential alternatives

Create enough materially different alternatives to reveal the design trade-offs. Stop when another alternative would add only cosmetic variation.

Alternatives should disagree about structure, information hierarchy, interaction flow, or primary affordance rather than only color, spacing, typography, or copy. Avoid sharing so much layout code that the alternatives cannot differ meaningfully.

Make each alternative easy to identify and switch. A URL parameter, local control, or existing development mechanism is sufficient; do not build infrastructure merely for variant selection.

## Prevent prototype leakage

Mark prototype-only components and controls clearly. Ensure losing alternatives, switchers, flags, fixtures, and stub actions cannot ship accidentally.

When a direction is chosen, record which alternative won and why. Reimplement the result cleanly for production rather than promoting the prototype unchanged.
