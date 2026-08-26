'use client';

import { useEffect, type ReactNode } from 'react';
import { Button, Drawer } from '@heroui/react';
import { X } from 'lucide-react';

type AdminSideSheetProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  width?: 'half' | 'md';
  dismissDisabled?: boolean;
};

export function AdminSideSheet({
  open,
  title,
  description,
  onClose,
  footer,
  children,
  width = 'half',
  dismissDisabled = false,
}: AdminSideSheetProps) {
  useEffect(() => {
    if (!open || dismissDisabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, dismissDisabled, onClose]);

  return (
    <Drawer
      isOpen={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !dismissDisabled) {
          onClose();
        }
      }}
    >
      <Drawer.Backdrop
        className="admin-side-sheet-backdrop"
        isDismissable={!dismissDisabled}
      >
        <Drawer.Content
          placement="right"
          className={`admin-side-sheet admin-side-sheet--${width}`}
        >
          <Drawer.Dialog className="flex min-h-0 flex-1 flex-col bg-white">
            <Drawer.Header className="shrink-0 border-b border-zinc-100">
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0 pl-2">
                  <Drawer.Heading className="font-body text-lg font-medium text-zinc-800">
                    {title}
                  </Drawer.Heading>
                  {description ? (
                    <p className="mt-0 font-body text-sm text-zinc-500">{description}</p>
                  ) : null}
                </div>
                <Button
                  isIconOnly
                  aria-label="Close"
                  variant="ghost"
                  isDisabled={dismissDisabled}
                  onPress={onClose}
                  className="shrink-0"
                >
                  <X className="size-6 text-red-600" aria-hidden />
                </Button>
              </div>
            </Drawer.Header>

            <Drawer.Body className="min-h-0 flex-1 overflow-y-auto">
              {children}
            </Drawer.Body>

            {footer ? (
              <Drawer.Footer className="admin-side-sheet__footer shrink-0 border-t border-zinc-100">
                {footer}
              </Drawer.Footer>
            ) : null}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
