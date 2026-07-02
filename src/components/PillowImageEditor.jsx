// PillowImageEditor was upgraded in place to a Fabric.js interactive canvas.
// The implementation now lives in ./ImageEditor/. This thin re-export keeps the
// public component name and props stable for all existing embed sites:
//   { user, savedImages, onSaveSuccess, stickyToolbar, toolbarStickyTopClass, compactShell }
export { default } from './ImageEditor/index.jsx';
