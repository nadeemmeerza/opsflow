"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  useGetTicketQuery,
  useUpdateTicketMutation,
} from "@/features/tickets/ticketsApi";

import { useGetCustomersQuery } from "@/features/customers/customersApi";
import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import { useGetOrganizationMembersQuery } from "@/features/organizations/organizationsApi";

import { useNotification } from "@/components/notifications/NotificationContext";
import { getApiErrorMessage } from "@/store/api/apiSlice";

import styles from "./edit-ticket.module.scss";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell/AppShell";

const ticketSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters"),

  description: z
    .string()
    .max(
      5000,
      "Description must not exceed 5000 characters",
    ),

  customerId: z
    .string()
    .min(1, "Customer is required"),

  projectId: z.string(),

  assigneeId: z.string(),

  status: z.enum([
    "open",
    "in_progress",
    "waiting",
    "resolved",
    "closed",
  ]),

  priority: z.enum([
    "low",
    "medium",
    "high",
    "urgent",
  ]),
});

type TicketFormValues =
  z.infer<typeof ticketSchema>;

interface ApiErrorState {
  ticketId: string;
  messages: string[];
}

export default function EditTicketPage() {
  const params = useParams();
  const router = useRouter();

  const organizationId =
    params.organizationId as string;

  const ticketId =
    params.ticketId as string;

  const {
    success,
    error: showError,
  } = useNotification();

  const [
    apiError,
    setApiError,
  ] = useState<ApiErrorState | null>(null);

  const {
    data: ticketResponse,
    isLoading: isLoadingTicket,
    isError: isTicketError,
  } = useGetTicketQuery({
    organizationId,
    ticketId,
  });

  const {
    data: customersResponse,
    isLoading: isLoadingCustomers,
  } = useGetCustomersQuery({
    organizationId,
  });

  const {
    data: projectsResponse,
    isLoading: isLoadingProjects,
  } = useGetProjectsQuery({
    organizationId,
    query: {
      page: 1,
      limit: 50,
      sortBy: "name",
      sortOrder: "asc",
    },
  });

  const {
    data: membersResponse,
    isLoading: isLoadingMembers,
  } = useGetOrganizationMembersQuery({
    organizationId,
    query: {
      page: 1,
      limit: 50,
    },
  });

  const [
    updateTicket,
    { isLoading: isUpdating },
  ] = useUpdateTicketMutation();

  const ticket = ticketResponse?.data;
  const customers =
    customersResponse?.data.items ?? [];
  const projects =
    projectsResponse?.data.items ?? [];
  const members =
    membersResponse?.data.items ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),

    defaultValues: {
      title: "",
      description: "",
      customerId: "",
      projectId: "",
      assigneeId: "",
      status: "open",
      priority: "medium",
    },
  });

  useEffect(() => {
    if (!ticket) {
      return;
    }

    reset({
      title: ticket.title,
      description:
        ticket.description ?? "",

      customerId:
        typeof ticket.customerId === "object"
          ? ticket.customerId._id
          : ticket.customerId,

      projectId:
        typeof ticket.projectId === "object" &&
        ticket.projectId !== null
          ? ticket.projectId._id
          : (ticket.projectId ?? ""),

      assigneeId:
        typeof ticket.assigneeId === "object" &&
        ticket.assigneeId !== null
          ? ticket.assigneeId._id
          : (ticket.assigneeId ?? ""),

      status: ticket.status,
      priority: ticket.priority,
    });
  }, [ticket, reset]);

  const currentApiMessages =
    apiError?.ticketId === ticketId
      ? apiError.messages
      : [];

  const onSubmit = async (
    values: TicketFormValues,
  ) => {
    setApiError(null);

    try {
      await updateTicket({
        organizationId,
        ticketId,

        data: {
          title: values.title,
          description: values.description,
          customerId: values.customerId,
          projectId:
            values.projectId || undefined,
          assigneeId:
            values.assigneeId || undefined,
          status: values.status,
          priority: values.priority,
        },
      }).unwrap();

      success(
        "Ticket updated successfully.",
      );

      router.push(
        `/organizations/${organizationId}/tickets/${ticketId}`,
      );
    } catch (error) {
      const messages =
        getApiErrorMessage(error);

      console.error(
        "Failed to update ticket:",
        error,
      );

      setApiError({
        ticketId,
        messages,
      });

      showError(
        messages[0] ??
          "Failed to update ticket.",
      );
    }
  };

  if (isLoadingTicket) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className={styles.state}>
            Loading ticket...
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (isTicketError || !ticket) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div
            className={`${styles.state} ${styles.error}`}
          >
            Failed to load ticket.
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className={styles.page}>
          <div className={styles.header}>
            <div>
              <Link
                href={`/organizations/${organizationId}/tickets/${ticketId}`}
                className={styles.backLink}
              >
                ← Back to Ticket
              </Link>

              <h1>Edit Ticket</h1>

              <p>
                Update the ticket information.
              </p>
            </div>
          </div>

          {currentApiMessages.length > 0 && (
            <div className={styles.errorText}>
              {currentApiMessages.map(
                (message, index) => (
                  <p key={index}>{message}</p>
                ),
              )}
            </div>
          )}

          <form
            className={styles.form}
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className={styles.field}>
              <label htmlFor="title">
                Title
              </label>

              <input
                id="title"
                type="text"
                {...register("title")}
              />

              {errors.title && (
                <p className={styles.errorText}>
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                rows={6}
                {...register("description")}
              />

              {errors.description && (
                <p className={styles.errorText}>
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="customerId">
                Customer
              </label>

              <select
                id="customerId"
                {...register("customerId")}
                disabled={isLoadingCustomers}
              >
                <option value="">
                  Select customer
                </option>

                {customers.map(
                  (customer) => (
                    <option
                      key={customer._id}
                      value={customer._id}
                    >
                      {customer.name}
                      {customer.company
                        ? ` — ${customer.company}`
                        : ""}
                    </option>
                  ),
                )}
              </select>

              {errors.customerId && (
                <p className={styles.errorText}>
                  {errors.customerId.message}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="projectId">
                Project
              </label>

              <select
                id="projectId"
                {...register("projectId")}
                disabled={isLoadingProjects}
              >
                <option value="">
                  No project
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={project._id}
                      value={project._id}
                    >
                      {project.key} —{" "}
                      {project.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="assigneeId">
                Assignee
              </label>

              <select
                id="assigneeId"
                {...register("assigneeId")}
                disabled={isLoadingMembers}
              >
                <option value="">
                  Unassigned
                </option>

                {members.map(
                  (member) => (
                    <option
                      key={member.userId}
                      value={member.userId}
                    >
                      {member.user?.name ??
                        member.userId}

                      {member.user?.email
                        ? ` — ${member.user.email}`
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="status">
                  Status
                </label>

                <select
                  id="status"
                  {...register("status")}
                >
                  <option value="open">
                    Open
                  </option>

                  <option value="in_progress">
                    In Progress
                  </option>

                  <option value="waiting">
                    Waiting
                  </option>

                  <option value="resolved">
                    Resolved
                  </option>

                  <option value="closed">
                    Closed
                  </option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="priority">
                  Priority
                </label>

                <select
                  id="priority"
                  {...register("priority")}
                >
                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>

                  <option value="urgent">
                    Urgent
                  </option>
                </select>
              </div>
            </div>

            <div className={styles.actions}>
              <Link
                href={`/organizations/${organizationId}/tickets/${ticketId}`}
                className={
                  styles.cancelButton
                }
              >
                Cancel
              </Link>

              <button
                type="submit"
                className={styles.saveButton}
                disabled={isUpdating}
              >
                {isUpdating
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}