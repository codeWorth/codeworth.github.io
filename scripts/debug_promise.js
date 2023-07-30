window.addEventListener("unhandledrejection", event => {
    console.error("Unhandled: ", event.reason.stack);
});
