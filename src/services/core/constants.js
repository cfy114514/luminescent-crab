
// Mapping from Upload Slot ID to Prompt View Type
export const SLOT_TO_VIEW_TYPE = {
    'p_front': 'front',
    'p_angle': 'angle_front',
    'p_back': 'back',
    'p_top': 'top_overhead',
    'p_detail': 'detail',
    'p_inside': 'inside',
    'm_front': 'model_front',
    'm_side': 'model_side',
    'm_back': 'model_back',
    'm_pose1': 'model_lifestyle',
    'm_pose2': 'model_lifestyle_hat',
    'm_pose3': 'model_lifestyle_smile',
    'm_back_angle': 'model_back_angle'
};

export const SLOT_LABELS = {
    'p_front': 'Product Front',
    'p_angle': 'Product Angle',
    'p_back': 'Product Back',
    'p_top': 'Product Top',
    'p_detail': 'Product Detail',
    'p_inside': 'Product Inside',
    'm_front': 'Model Front',
    'm_side': 'Model Side',
    'm_back': 'Model Back',
    'm_pose1': 'Model Pose 1',
    'm_pose2': 'Model Pose 2',
    'm_pose3': 'Model Pose 3',
    'm_back_angle': 'Model Back-Angle'
};
