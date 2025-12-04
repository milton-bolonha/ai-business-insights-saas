"use client";

import { useState, useCallback } from "react";
import type { Tile, Contact } from "@/lib/types";

export interface ModalState {
  selectedTile: Tile | null;
  selectedContact: Contact | null;
  isAddContactOpen: boolean;
  isAddCompanyOpen: boolean;
  isAddPromptOpen: boolean;
  isBulkUploadOpen: boolean;
  isCreateBlankDashboardOpen: boolean;
}

export interface ModalActions {
  openTileDetail: (tile: Tile) => void;
  closeTileDetail: () => void;
  openContactDetail: (contact: Contact) => void;
  closeContactDetail: () => void;
  openAddContact: () => void;
  closeAddContact: () => void;
  openAddCompany: () => void;
  closeAddCompany: () => void;
  openAddPrompt: () => void;
  closeAddPrompt: () => void;
  openBulkUpload: () => void;
  closeBulkUpload: () => void;
  openCreateBlankDashboard: () => void;
  closeCreateBlankDashboard: () => void;
}

export function useModalState(): ModalState & ModalActions {
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddPromptOpen, setIsAddPromptOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isCreateBlankDashboardOpen, setIsCreateBlankDashboardOpen] = useState(false);

  const openTileDetail = useCallback((tile: Tile) => {
    setSelectedTile(tile);
  }, []);

  const closeTileDetail = useCallback(() => {
    setSelectedTile(null);
  }, []);

  const openContactDetail = useCallback((contact: Contact) => {
    setSelectedContact(contact);
  }, []);

  const closeContactDetail = useCallback(() => {
    setSelectedContact(null);
  }, []);

  const openAddContact = useCallback(() => {
    setIsAddContactOpen(true);
  }, []);

  const closeAddContact = useCallback(() => {
    setIsAddContactOpen(false);
  }, []);

  const openAddCompany = useCallback(() => {
    setIsAddCompanyOpen(true);
  }, []);

  const closeAddCompany = useCallback(() => {
    setIsAddCompanyOpen(false);
  }, []);

  const openAddPrompt = useCallback(() => {
    setIsAddPromptOpen(true);
  }, []);

  const closeAddPrompt = useCallback(() => {
    setIsAddPromptOpen(false);
  }, []);

  const openBulkUpload = useCallback(() => {
    setIsBulkUploadOpen(true);
  }, []);

  const closeBulkUpload = useCallback(() => {
    setIsBulkUploadOpen(false);
  }, []);

  const openCreateBlankDashboard = useCallback(() => {
    setIsCreateBlankDashboardOpen(true);
  }, []);

  const closeCreateBlankDashboard = useCallback(() => {
    setIsCreateBlankDashboardOpen(false);
  }, []);

  return {
    selectedTile,
    selectedContact,
    isAddContactOpen,
    isAddCompanyOpen,
    isAddPromptOpen,
    isBulkUploadOpen,
    isCreateBlankDashboardOpen,
    openTileDetail,
    closeTileDetail,
    openContactDetail,
    closeContactDetail,
    openAddContact,
    closeAddContact,
    openAddCompany,
    closeAddCompany,
    openAddPrompt,
    closeAddPrompt,
    openBulkUpload,
    closeBulkUpload,
    openCreateBlankDashboard,
    closeCreateBlankDashboard,
  };
}

