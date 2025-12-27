# Set C: Pose Reference + Hat Swap Mode

## Core Objective
**Pose-Guided Model Generation with Hat Placement**.

Set C combines the best of both worlds:
- **From POSE REF**: Extract pose, body angle, head tilt, camera perspective.
- **From HAT ASSET**: Place the exact product hat on the model.
- **From Persona Config**: Generate face and identity.
- **From Commercial Standards**: Apply studio background and lighting.

## Key Difference from Set B
| Feature | Set B | Set C |
|---------|-------|-------|
| Pose Source | Prompt-described or POSE REF | POSE REF (stronger adherence) |
| Hat Source | Generated from description | **HAT ASSET image (100% fidelity)** |
| Face Source | Persona Config | Persona Config |
| Background | Studio White | Studio White |

## Prompt Strategy
Set C emphasizes:
1. **Hat Fidelity**: "The hat from HAT ASSET must be rendered with 100% accuracy."
2. **Pose Matching**: "The model's body position and head angle should match POSE REF."
3. **Commercial Output**: Studio background, soft lighting.

## Technical Notes
- Gemini's image API does not support true inpainting/editing.
- Set C does NOT preserve POSE REF's body/clothes/background (only the pose).
- For true "edit only head" functionality, use external inpainting APIs.

## File Structure
```
engines/setC/
├── modelReferenceEngine.js   # Main prompt logic
├── index.js                  # Exports
└── tree/                     # Isolated prompt tree
```
