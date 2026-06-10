"use client";

import { useFAAStore, type InterfaceLanguage } from "@/lib/store";
import { useT } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const settings = useFAAStore((s) => s.settings);
  const setLanguage = useFAAStore((s) => s.setLanguage);
  const setDisplayName = useFAAStore((s) => s.setDisplayName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("common.settings.title")}</DialogTitle>
          <DialogDescription>{t("common.settings.description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 py-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-display-name">
              {t("common.settings.displayName")}
            </Label>
            <Input
              id="settings-display-name"
              value={settings.displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-language">{t("common.settings.language")}</Label>
            <Select
              value={settings.language}
              onValueChange={(v) => setLanguage(v as InterfaceLanguage)}
            >
              <SelectTrigger id="settings-language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("common.settings.language.en")}</SelectItem>
                <SelectItem value="ko">{t("common.settings.language.ko")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("common.settings.languageHelp")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t("common.settings.done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
