// ItemList.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
// actions
import { bookmark } from "@/actions/appState";
import { GroupedVirtuoso } from "react-virtuoso";
import { Box } from "@mui/system";
import { Button, Stack, Typography } from "@mui/material";
import { onDragStart } from "@/lib/drag";
import { HiChevronDoubleDown } from 'react-icons/hi';
import { useAppDispatch } from "@/lib/hooks";
import { useSWRF } from "@/lib/swr";
import WindowDefinitions from "./WindowFolder/WindowDefinitions";

const GroupLabel = React.memo(({ index, data, callback }) => {
  const group = data[index];
  const key = WindowDefinitions(group.type).apipath;

  const { data: item } = useSWRF(`/api/${key}?${key}=${group.id}`);

  const title = (type) => {
    if (type === "Document") {
      return <span draggable={true} onDragStart={(e) => onDragStart(e, item?._id, "Document")}>{item?.title}</span>;
    }
    if (type === "Group") {
      return <span draggable={true} onDragStart={(e) => onDragStart(e, item?._id, "Group")}>{item?.label}</span>;
    }
    if (type === "Search") {
      return <span draggable={true} onDragStart={(e) => onDragStart(e, item?._id, "Search")}>{item?.query}</span>;
    }
    if (type === "Note") {
      return <span draggable={true} onDragStart={(e) => onDragStart(e, item?._id, "Note")}>{item?.label}</span>;
    }
    if (type === "Cluster") {
      return <span draggable={true} onDragStart={(e) => onDragStart(e, item?._id, "Cluster", index)}>{`${data[index]?.label} (${data[index]?.ranked_documents?.length} docs)`}</span>;
    }
  };

  if (data.length === 1) {
    return <div style={{ height: "1px" }}></div>;
  }

  return (
    <Box
      key={`${index}-${group.id}`}
      sx={{
        backgroundColor: "#f9f9f9",
        padding: "0.5rem",
        borderBottom: "1px solid #ccc",
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Typography>{`${group.type}: `}{title(group.type)}</Typography>
        <Button size="small" onClick={(e) => callback(e, index)} sx={{ color: "#CCCCCC", width: "1em" }}><HiChevronDoubleDown /></Button>
      </Stack>
    </Box>
  );
});

GroupLabel.displayName = 'GroupLabel';


export default function ItemList({ onSelect, data, render, loadMore }) {
  const ref = useRef(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(-1);
  const listRef = useRef(null);
  const dispatch = useAppDispatch();

  const groupCounts = useMemo(() => data ? data.map((d) => d?.ranked_documents?.length) : [], [data]);
  const reduced_data = useMemo(() => data ? data.reduce((acc, dl) => acc.concat(dl?.ranked_documents), []) : [], [data]);

  const keyDownCallback = useCallback(
    (e) => {
      let nextIndex = null;

      if (e.code === "ArrowUp") {
        nextIndex = Math.max(0, currentItemIndex - 1);
      } else if (e.code === "ArrowDown") {
        nextIndex = Math.min(reduced_data.length - 1, currentItemIndex + 1);
      } else if (e.code === "Enter") {
        dispatch(bookmark(reduced_data[currentItemIndex][0]));
      }

      if (nextIndex !== null) {
        ref.current.scrollIntoView({
          index: nextIndex,
          behavior: "auto",
          done: () => {
            setCurrentItemIndex(nextIndex);
          },
        });
        e.preventDefault();
      }
      onSelect(reduced_data[nextIndex]);
    },
    [currentItemIndex, ref, setCurrentItemIndex, dispatch, onSelect, reduced_data]
  );

  const scrollerRef = useCallback(
    (element) => {
      if (element) {
        element.addEventListener("keydown", keyDownCallback);
        listRef.current = element;
      } else if (listRef.current) {
        listRef.current.removeEventListener("keydown", keyDownCallback);
      }
    },
    [keyDownCallback]
  );

  const handleSetCurrentItemIndex = (index) => {
    setCurrentItemIndex(index);
    onSelect(reduced_data[index]);
  };

  const handleScroll = (e, index) => {
    e.preventDefault();
    const total = groupCounts.reduce((acc, curr) => acc + curr, 0);
    const i = groupCounts.slice(0, index + 1).reduce((acc, curr) => acc + curr, 0);
    const j = i >= total ? 0 : i;
    ref?.current.scrollToIndex({ index: j });
  };

  return (
    <GroupedVirtuoso
      ref={ref}
      initialItemCount={1}
      groupCounts={groupCounts}
      endReached={loadMore}
      itemContent={(index) => render(index, reduced_data?.at(index), currentItemIndex, handleSetCurrentItemIndex)}
      groupContent={(index) => <GroupLabel callback={handleScroll} index={index} data={data} />}
      scrollerRef={scrollerRef}
    />
  );
}
