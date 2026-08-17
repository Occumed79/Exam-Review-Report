# Third-party assets

## Exam Reviewer human hologram mesh

- Asset: `male_base_mesh.glb`
- Source project: `BoQsc/Godot-3D-Male-Base-Mesh`
- Original creator/source: Orange Juice Games male base mesh
- Pinned source release: `1.0.3`
- Runtime asset URL: `https://raw.githubusercontent.com/BoQsc/Godot-3D-Male-Base-Mesh/1.0.3/Original/male_base_mesh.glb`
- License: Creative Commons Zero v1.0 Universal (CC0-1.0)
- Use in this application: the source mesh surface is sampled into a luminous point cloud for the Injury Intelligence hologram. The original solid material is not rendered.

The upstream repository states that the male base mesh is provided under CC0 and may be reused, modified, and distributed, including commercially.

## Drug Checker holographic material

- Asset: Anderson Mancini `HolographicMaterialVanilla`
- Source project: `ektogamat/threejs-vanilla-holographic-material`
- Source file: `src/HolographicMaterialVanilla.js`
- License: MIT
- Upstream demo: `https://threejs-vanilla-holographic-material.vercel.app/`
- Local adaptation: `artifacts/sme-risk-engine/src/vendor/andersonManciniHolographicMaterial.ts`
- Use in this application: the shader's holographic scanline, Fresnel, signal/flicker and additive-light treatment is adapted onto real PubChem 3D atom and bond geometry in the Drug Checker molecular viewer.

The upstream repository identifies the project as MIT licensed. The adaptation retains attribution and is used as the visual material layer rather than recreating the hologram effect with CSS.
