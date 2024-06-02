/*
This is a generated source file!
If you want to view the original source code, please visit:
https://github.com/kitschpatrol/yanki-obsidian
*/

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => YankiPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var yankiPluginDefaultSettings = {
  mySetting: "default"
};
var YankiPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "settings", yankiPluginDefaultSettings);
  }
  // Typed overrides
  async loadData() {
    return super.loadData();
  }
  async loadSettings() {
    this.settings = { ...this.settings, ...await this.loadData() };
  }
  async onload() {
    await this.loadSettings();
    const ribbonIconElement = this.addRibbonIcon("dice", "Yanki Plugin", () => {
      new import_obsidian.Notice("This is a notice!");
    });
    ribbonIconElement.addClass("yanki-plugin-ribbon-class");
    const statusBarItemElement = this.addStatusBarItem();
    statusBarItemElement.setText("Status Bar Text from Yanki Plugin");
    this.addCommand({
      callback: () => {
        new SampleModal(this.app).open();
      },
      id: "open-sample-modal-simple",
      name: "Open sample modal (simple)"
    });
    this.addCommand({
      editorCallback(editor, view) {
        console.log(view);
        console.log(editor.getSelection());
        editor.replaceSelection("Sample Editor Command");
      },
      id: "sample-editor-command",
      name: "Sample editor command"
    });
    this.addCommand({
      checkCallback: (checking) => {
        const markdownView = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
        if (markdownView) {
          if (!checking) {
            new SampleModal(this.app).open();
          }
          return true;
        }
      },
      id: "open-sample-modal-complex",
      name: "Open sample modal (complex)"
    });
    this.addSettingTab(new SampleSettingTab(this.app, this));
    this.registerDomEvent(document, "click", (event) => {
      console.log("click", event);
    });
    this.registerInterval(
      window.setInterval(
        () => {
          console.log("setInterval");
        },
        5 * 60 * 1e3
      )
    );
  }
  onunload() {
    console.log("unloading Yanki plugin");
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var SampleModal = class extends import_obsidian.Modal {
  // "Useless" constructor?
  // constructor(app: App) {
  // 	super(app)
  // }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.setText("Hi from Yanki plugin!");
  }
};
var SampleSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    __publicField(this, "plugin");
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Setting #1").setDesc("It's a secret!").addText(
      (text) => text.setPlaceholder("Enter your secret").setValue(this.plugin.settings.mySetting).onChange(async (value) => {
        this.plugin.settings.mySetting = value;
        await this.plugin.saveSettings();
      })
    );
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qIGVzbGludC1kaXNhYmxlIG5vLW5ldyAqL1xuaW1wb3J0IHtcblx0dHlwZSBBcHAsXG5cdHR5cGUgRWRpdG9yLFxuXHR0eXBlIE1hcmtkb3duRmlsZUluZm8sXG5cdE1hcmtkb3duVmlldyxcblx0TW9kYWwsXG5cdE5vdGljZSxcblx0UGx1Z2luLFxuXHRQbHVnaW5TZXR0aW5nVGFiLFxuXHRTZXR0aW5nLFxufSBmcm9tICdvYnNpZGlhbidcblxuLy8gUmVtZW1iZXIgdG8gcmVuYW1lIHRoZXNlIGNsYXNzZXMgYW5kIGludGVyZmFjZXMhXG5cbnR5cGUgWWFua2lQbHVnaW5TZXR0aW5ncyA9IHtcblx0bXlTZXR0aW5nOiBzdHJpbmdcbn1cblxuY29uc3QgeWFua2lQbHVnaW5EZWZhdWx0U2V0dGluZ3M6IFlhbmtpUGx1Z2luU2V0dGluZ3MgPSB7XG5cdG15U2V0dGluZzogJ2RlZmF1bHQnLFxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBZYW5raVBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG5cdHB1YmxpYyBzZXR0aW5nczogWWFua2lQbHVnaW5TZXR0aW5ncyA9IHlhbmtpUGx1Z2luRGVmYXVsdFNldHRpbmdzXG5cblx0Ly8gVHlwZWQgb3ZlcnJpZGVzXG5cdGFzeW5jIGxvYWREYXRhKCk6IFByb21pc2U8WWFua2lQbHVnaW5TZXR0aW5ncz4ge1xuXHRcdHJldHVybiBzdXBlci5sb2FkRGF0YSgpIGFzIFByb21pc2U8WWFua2lQbHVnaW5TZXR0aW5ncz5cblx0fVxuXG5cdGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcblx0XHR0aGlzLnNldHRpbmdzID0geyAuLi50aGlzLnNldHRpbmdzLCAuLi4oYXdhaXQgdGhpcy5sb2FkRGF0YSgpKSB9XG5cdH1cblxuXHRhc3luYyBvbmxvYWQoKSB7XG5cdFx0YXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKVxuXG5cdFx0Ly8gVGhpcyBjcmVhdGVzIGFuIGljb24gaW4gdGhlIGxlZnQgcmliYm9uLlxuXHRcdGNvbnN0IHJpYmJvbkljb25FbGVtZW50ID0gdGhpcy5hZGRSaWJib25JY29uKCdkaWNlJywgJ1lhbmtpIFBsdWdpbicsICgpID0+IHtcblx0XHRcdC8vIENhbGxlZCB3aGVuIHRoZSB1c2VyIGNsaWNrcyB0aGUgaWNvbi5cblx0XHRcdG5ldyBOb3RpY2UoJ1RoaXMgaXMgYSBub3RpY2UhJylcblx0XHR9KVxuXHRcdC8vIFBlcmZvcm0gYWRkaXRpb25hbCB0aGluZ3Mgd2l0aCB0aGUgcmliYm9uXG5cdFx0cmliYm9uSWNvbkVsZW1lbnQuYWRkQ2xhc3MoJ3lhbmtpLXBsdWdpbi1yaWJib24tY2xhc3MnKVxuXG5cdFx0Ly8gVGhpcyBhZGRzIGEgc3RhdHVzIGJhciBpdGVtIHRvIHRoZSBib3R0b20gb2YgdGhlIGFwcC4gRG9lcyBub3Qgd29yayBvbiBtb2JpbGUgYXBwcy5cblx0XHRjb25zdCBzdGF0dXNCYXJJdGVtRWxlbWVudCA9IHRoaXMuYWRkU3RhdHVzQmFySXRlbSgpXG5cdFx0c3RhdHVzQmFySXRlbUVsZW1lbnQuc2V0VGV4dCgnU3RhdHVzIEJhciBUZXh0IGZyb20gWWFua2kgUGx1Z2luJylcblxuXHRcdC8vIFRoaXMgYWRkcyBhIHNpbXBsZSBjb21tYW5kIHRoYXQgY2FuIGJlIHRyaWdnZXJlZCBhbnl3aGVyZVxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRjYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHRuZXcgU2FtcGxlTW9kYWwodGhpcy5hcHApLm9wZW4oKVxuXHRcdFx0fSxcblx0XHRcdGlkOiAnb3Blbi1zYW1wbGUtbW9kYWwtc2ltcGxlJyxcblx0XHRcdG5hbWU6ICdPcGVuIHNhbXBsZSBtb2RhbCAoc2ltcGxlKScsXG5cdFx0fSlcblxuXHRcdC8vIFRoaXMgYWRkcyBhbiBlZGl0b3IgY29tbWFuZCB0aGF0IGNhbiBwZXJmb3JtIHNvbWUgb3BlcmF0aW9uIG9uIHRoZSBjdXJyZW50IGVkaXRvciBpbnN0YW5jZVxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRlZGl0b3JDYWxsYmFjayhlZGl0b3I6IEVkaXRvciwgdmlldzogTWFya2Rvd25GaWxlSW5mbyB8IE1hcmtkb3duVmlldyk6IHVuZGVmaW5lZCB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHZpZXcpXG5cdFx0XHRcdGNvbnNvbGUubG9nKGVkaXRvci5nZXRTZWxlY3Rpb24oKSlcblx0XHRcdFx0ZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24oJ1NhbXBsZSBFZGl0b3IgQ29tbWFuZCcpXG5cblx0XHRcdFx0Ly9cblx0XHRcdH0sXG5cdFx0XHRpZDogJ3NhbXBsZS1lZGl0b3ItY29tbWFuZCcsXG5cdFx0XHRuYW1lOiAnU2FtcGxlIGVkaXRvciBjb21tYW5kJyxcblx0XHR9KVxuXG5cdFx0Ly8gVGhpcyBhZGRzIGEgY29tcGxleCBjb21tYW5kIHRoYXQgY2FuIGNoZWNrIHdoZXRoZXIgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGFwcCBhbGxvd3MgZXhlY3V0aW9uIG9mIHRoZSBjb21tYW5kXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuXHRcdFx0XHQvLyBDb25kaXRpb25zIHRvIGNoZWNrXG5cdFx0XHRcdGNvbnN0IG1hcmtkb3duVmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldylcblx0XHRcdFx0aWYgKG1hcmtkb3duVmlldykge1xuXHRcdFx0XHRcdC8vIElmIGNoZWNraW5nIGlzIHRydWUsIHdlJ3JlIHNpbXBseSBcImNoZWNraW5nXCIgaWYgdGhlIGNvbW1hbmQgY2FuIGJlIHJ1bi5cblx0XHRcdFx0XHQvLyBJZiBjaGVja2luZyBpcyBmYWxzZSwgdGhlbiB3ZSB3YW50IHRvIGFjdHVhbGx5IHBlcmZvcm0gdGhlIG9wZXJhdGlvbi5cblx0XHRcdFx0XHRpZiAoIWNoZWNraW5nKSB7XG5cdFx0XHRcdFx0XHRuZXcgU2FtcGxlTW9kYWwodGhpcy5hcHApLm9wZW4oKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIFRoaXMgY29tbWFuZCB3aWxsIG9ubHkgc2hvdyB1cCBpbiBDb21tYW5kIFBhbGV0dGUgd2hlbiB0aGUgY2hlY2sgZnVuY3Rpb24gcmV0dXJucyB0cnVlXG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGlkOiAnb3Blbi1zYW1wbGUtbW9kYWwtY29tcGxleCcsXG5cdFx0XHRuYW1lOiAnT3BlbiBzYW1wbGUgbW9kYWwgKGNvbXBsZXgpJyxcblx0XHR9KVxuXG5cdFx0Ly8gVGhpcyBhZGRzIGEgc2V0dGluZ3MgdGFiIHNvIHRoZSB1c2VyIGNhbiBjb25maWd1cmUgdmFyaW91cyBhc3BlY3RzIG9mIHRoZSBwbHVnaW5cblx0XHR0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNhbXBsZVNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKVxuXG5cdFx0Ly8gSWYgdGhlIHBsdWdpbiBob29rcyB1cCBhbnkgZ2xvYmFsIERPTSBldmVudHMgKG9uIHBhcnRzIG9mIHRoZSBhcHAgdGhhdCBkb2Vzbid0IGJlbG9uZyB0byB0aGlzIHBsdWdpbilcblx0XHQvLyBVc2luZyB0aGlzIGZ1bmN0aW9uIHdpbGwgYXV0b21hdGljYWxseSByZW1vdmUgdGhlIGV2ZW50IGxpc3RlbmVyIHdoZW4gdGhpcyBwbHVnaW4gaXMgZGlzYWJsZWQuXG5cdFx0dGhpcy5yZWdpc3RlckRvbUV2ZW50KGRvY3VtZW50LCAnY2xpY2snLCAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdjbGljaycsIGV2ZW50KVxuXHRcdH0pXG5cblx0XHQvLyBXaGVuIHJlZ2lzdGVyaW5nIGludGVydmFscywgdGhpcyBmdW5jdGlvbiB3aWxsIGF1dG9tYXRpY2FsbHkgY2xlYXIgdGhlIGludGVydmFsIHdoZW4gdGhlIHBsdWdpbiBpcyBkaXNhYmxlZC5cblx0XHR0aGlzLnJlZ2lzdGVySW50ZXJ2YWwoXG5cdFx0XHR3aW5kb3cuc2V0SW50ZXJ2YWwoXG5cdFx0XHRcdCgpID0+IHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnc2V0SW50ZXJ2YWwnKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHQ1ICogNjAgKiAxMDAwLFxuXHRcdFx0KSxcblx0XHQpXG5cdH1cblxuXHRvbnVubG9hZCgpIHtcblx0XHRjb25zb2xlLmxvZygndW5sb2FkaW5nIFlhbmtpIHBsdWdpbicpXG5cdH1cblxuXHRhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG5cdFx0YXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKVxuXHR9XG59XG5cbmNsYXNzIFNhbXBsZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuXHQvLyBcIlVzZWxlc3NcIiBjb25zdHJ1Y3Rvcj9cblx0Ly8gY29uc3RydWN0b3IoYXBwOiBBcHApIHtcblx0Ly8gXHRzdXBlcihhcHApXG5cdC8vIH1cblxuXHRvbkNsb3NlKCkge1xuXHRcdGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzXG5cdFx0Y29udGVudEVsLmVtcHR5KClcblx0fVxuXG5cdG9uT3BlbigpIHtcblx0XHRjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpc1xuXHRcdGNvbnRlbnRFbC5zZXRUZXh0KCdIaSBmcm9tIFlhbmtpIHBsdWdpbiEnKVxuXHR9XG59XG5cbmNsYXNzIFNhbXBsZVNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcblx0cGx1Z2luOiBZYW5raVBsdWdpblxuXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFlhbmtpUGx1Z2luKSB7XG5cdFx0c3VwZXIoYXBwLCBwbHVnaW4pXG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW5cblx0fVxuXG5cdGRpc3BsYXkoKTogdm9pZCB7XG5cdFx0Y29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpc1xuXG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKVxuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSgnU2V0dGluZyAjMScpXG5cdFx0XHQuc2V0RGVzYyhcIkl0J3MgYSBzZWNyZXQhXCIpXG5cdFx0XHQuYWRkVGV4dCgodGV4dCkgPT5cblx0XHRcdFx0dGV4dFxuXHRcdFx0XHRcdC5zZXRQbGFjZWhvbGRlcignRW50ZXIgeW91ciBzZWNyZXQnKVxuXHRcdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5teVNldHRpbmcpXG5cdFx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MubXlTZXR0aW5nID0gdmFsdWVcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpXG5cdFx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0Esc0JBVU87QUFRUCxJQUFNLDZCQUFrRDtBQUFBLEVBQ3ZELFdBQVc7QUFDWjtBQUVBLElBQXFCLGNBQXJCLGNBQXlDLHVCQUFPO0FBQUEsRUFBaEQ7QUFBQTtBQUNDLHdCQUFPLFlBQWdDO0FBQUE7QUFBQTtBQUFBLEVBR3ZDLE1BQU0sV0FBeUM7QUFDOUMsV0FBTyxNQUFNLFNBQVM7QUFBQSxFQUN2QjtBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ3BCLFNBQUssV0FBVyxFQUFFLEdBQUcsS0FBSyxVQUFVLEdBQUksTUFBTSxLQUFLLFNBQVMsRUFBRztBQUFBLEVBQ2hFO0FBQUEsRUFFQSxNQUFNLFNBQVM7QUFDZCxVQUFNLEtBQUssYUFBYTtBQUd4QixVQUFNLG9CQUFvQixLQUFLLGNBQWMsUUFBUSxnQkFBZ0IsTUFBTTtBQUUxRSxVQUFJLHVCQUFPLG1CQUFtQjtBQUFBLElBQy9CLENBQUM7QUFFRCxzQkFBa0IsU0FBUywyQkFBMkI7QUFHdEQsVUFBTSx1QkFBdUIsS0FBSyxpQkFBaUI7QUFD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
