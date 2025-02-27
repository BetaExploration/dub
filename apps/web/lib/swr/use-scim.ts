import type { Directory } from "@boxyhq/saml-jackson";
import { fetcher } from "@dub/utils";
import { useRouter } from "next/router";
import { useMemo } from "react";
import useSWR from "swr";

export default function useSCIM() {
  const router = useRouter();
  const { slug } = router.query as {
    slug: string;
  };

  const { data, isLoading, mutate } = useSWR<{ directories: Directory[] }>(
    slug && `/api/projects/${slug}/scim`,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  const configured = useMemo(() => {
    return data?.directories && data.directories.length > 0;
  }, [data]);

  return {
    scim: data as { directories: Directory[] },
    provider: configured ? data!.directories[0].type : null,
    configured,
    loading: !slug || isLoading,
    mutate,
  };
}
