# Flowbase Fresh Cozy UI Theme

Flowbase should feel like a clear creative workspace: calm enough for deep work, compact enough for daily productivity, and fresh enough that boards, notes, AI tools, and whiteboards feel alive.

## Palette

- Ink: `#17201e` for primary text, active navigation, and high-contrast panels.
- Paper: `#fbfff8` for sidebar and primary surfaces.
- Canvas: `#f1faf6` for the app background.
- Mist: `#e8f6ef` and `#eef8f3` for grouped sidebar areas and whiteboard surfaces.
- Line: `#d6e7df` and `#c9ded5` for crisp but soft borders.
- Muted text: `#66756f` and `#7a8a84` for labels and secondary copy.
- Coral: `#ff6b4a` for primary creation actions.
- Mint: `#00a88f` for collaboration, assistant status, and fresh highlights.
- Violet: `#6257f6` for whiteboard and visual-space moments.
- Honey: `#ffd166`, Sky: `#55c7f5`, Rose: `#ff8ab3`, and Leaf: `#80d77b` for canvas notes, tags, and kanban states.

## Typography

Use the system sans stack. Keep sidebar group labels at `9px`, sidebar rows at `11px`, body UI at `text-sm`, and page titles between `text-xl` and `text-2xl`. Avoid oversized marketing headings inside the product.

## Spacing And Shape

Use 8px-radius panels and controls, compact 32px navigation rows, and 20px page padding on desktop. The expanded sidebar should sit around `228px`; the collapsed rail should sit around `68px`. Borders should be visible but soft; shadows should be subtle and used mostly to separate the sidebar from the workspace.

## Sidebar

The sidebar is a persistent left rail with a logo header, grouped menu sections, creation action, and footer status area. Group menu items under clear labels such as Workspace, Plan, Create, and System. When collapsed, it should keep only centered icons visible and expose labels through native tooltips.

## Interaction

Active states use Ink with Paper text. Hover states should feel clean and tactile with fresh mint-tinted backgrounds. Use Lucide icons for all menu and tool actions.