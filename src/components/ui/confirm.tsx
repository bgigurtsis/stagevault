
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface ConfirmOptions {
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
}

export const confirm = (options: ConfirmOptions): Promise<boolean> => {
  const { title, description, cancelText = "Cancel", confirmText = "Confirm" } = options;

  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const handleClose = (result: boolean) => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
      resolve(result);
    };

    const element = (
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleClose(false)}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleClose(true)}>
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    const ReactDOM = require("react-dom");
    ReactDOM.render(element, container);
  });
};
