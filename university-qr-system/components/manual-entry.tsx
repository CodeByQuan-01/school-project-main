"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ManualEntryProps {
  onSubmit: (studentId: string) => void;
}

export function ManualEntry({ onSubmit }: ManualEntryProps) {
  const [studentId, setStudentId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(studentId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentId">Enter Student ID</Label>
        <Input
          id="studentId"
          placeholder="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-[#66DE16] hover:bg-[#66DE16]/90 text-[#1B1F3B]"
      >
        Submit
      </Button>
    </form>
  );
}
