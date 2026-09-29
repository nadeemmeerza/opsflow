"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useNotification } from "@/components/notifications/NotificationContext";
import { getApiErrorMessage } from "@/store/api/apiSlice";

import { useCreateTicketMutation, useGetTicketsQuery } from "./ticketsApi";

import { useGetCustomersQuery } from "@/features/customers/customersApi";

import { useGetProjectsQuery } from "@/features/projects/projectsApi";

import { useGetOrganizationMembersQuery } from "@/features/organizations/organizationsApi";

import styles from "./CreateTicketForm.module.scss";

const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),

  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),

  customerId: z.string().min(1, "Customer is required"),

  projectId: z.string().optional(),

  assigneeId: z.string().optional(),

  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

interface CreateTicketFormProps {
  organizationId: string;
}

export default function CreateTicketForm({
  organizationId,
}: CreateTicketFormProps) {
  const router = useRouter();

  const { success, error: showError } = useNotification();

  // Backend validation errors are kept separately
  // from React Hook Form's client-side validation.
  const [apiError, setApiError] = useState<string[]>([]);

  const [createTicket, { isLoading }] = useCreateTicketMutation();

  const { data: customersResponse, isLoading: customersLoading } =
    useGetCustomersQuery({
      organizationId,
    });

  const { data: projectsResponse, isLoading: projectsLoading } =
    useGetProjectsQuery({
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
  isLoading: membersLoading,
} = useGetOrganizationMembersQuery({
  organizationId,
  query: {
    page: 1,
    limit: 10,
  },
});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),

    defaultValues: {
      title: "",
      description: "",
      customerId: "",
      projectId: "",
      assigneeId: "",
      priority: "medium",
    },
  });

  const customers = customersResponse?.data.items ?? [];

  const projects = projectsResponse?.data.items ?? [];

  const members = membersResponse?.data.items ?? [];

  const onSubmit = async (values: CreateTicketFormValues) => {
    // Clear errors from the previous submission.
    setApiError([]);

    try {
      const result = await createTicket({
        organizationId,

        data: {
          title: values.title,

          description: values.description || undefined,

          customerId: values.customerId,

          projectId: values.projectId || undefined,

          assigneeId: values.assigneeId || undefined,

          priority: values.priority,
        },
      }).unwrap();

      success("Ticket created successfully.");

      router.push(
        `/organizations/${organizationId}/tickets/${result.data._id}`,
      );
    } catch (error) {
      const messages = getApiErrorMessage(error);

      console.error("Failed to create ticket:", error);

      // Display all backend errors in the form.
      setApiError(messages);

      // Display the first error as a toast.
      showError(messages[0] ?? "Failed to create ticket.");
    }
  };

  const loadingOptions = customersLoading || projectsLoading || membersLoading;

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      {apiError.length > 0 && (
        <div className={styles.error}>
          {apiError.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="title">
          Title <span>*</span>
        </label>

        <input
          id="title"
          type="text"
          placeholder="Enter ticket title"
          {...register("title")}
        />

        {errors.title && <p className={styles.error}>{errors.title.message}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Description</label>

        <textarea
          id="description"
          rows={6}
          placeholder="Describe the issue..."
          {...register("description")}
        />

        {errors.description && (
          <p className={styles.error}>{errors.description.message}</p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="customerId">
          Customer <span>*</span>
        </label>

        <select
          id="customerId"
          {...register("customerId")}
          disabled={loadingOptions}
        >
          <option value="">Select customer</option>

          {customers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.name}

              {customer.company ? ` — ${customer.company}` : ""}
            </option>
          ))}
        </select>

        {errors.customerId && (
          <p className={styles.error}>{errors.customerId.message}</p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="projectId">Project</label>

        <select
          id="projectId"
          {...register("projectId")}
          disabled={loadingOptions}
        >
          <option value="">No project</option>

          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.key} — {project.name}
            </option>
          ))}
        </select>

        {errors.projectId && (
          <p className={styles.error}>{errors.projectId.message}</p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="assigneeId">Assignee</label>

        <select
          id="assigneeId"
          {...register("assigneeId")}
          disabled={loadingOptions}
        >
          <option value="">Unassigned</option>

          {members.map((member) => (
            <option key={member._id} value={member.userId}>
              {member.user?.name ?? member.userId}
            </option>
          ))}
        </select>

        {errors.assigneeId && (
          <p className={styles.error}>{errors.assigneeId.message}</p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="priority">Priority</label>

        <select id="priority" {...register("priority")}>
          <option value="low">Low</option>

          <option value="medium">Medium</option>

          <option value="high">High</option>

          <option value="urgent">Urgent</option>
        </select>

        {errors.priority && (
          <p className={styles.error}>{errors.priority.message}</p>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() =>
            router.push(`/organizations/${organizationId}/tickets`)
          }
          disabled={isLoading}
        >
          Cancel
        </button>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading || loadingOptions}
        >
          {isLoading ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </form>
  );
}
