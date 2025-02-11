import { useAppSelector } from "@/util/hooks";

// material ui
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import CircleIcon from "@mui/icons-material/Circle";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";

// custom
import GroupSelector from "@/components/Groups/GroupSelector";
import BookmarkSelector from "@/components/BookmarkSelector";
import DocumentTitle from "@/components/Documents/DocumentTitle";
import Deleter from "@/components/Deleter";

//actions
import { mark, removeDocumentFromGroup } from "@/actions/windows";

//utils
import { useSWRHook } from "@/util/swr";
import { PreprocessTitle } from "@/util/Preprocessers";
import { useAppDispatch } from "@/util/hooks";

import { onDragStart } from "@/util/drag";

export default function DocumentListItem(props) {
  const dispatch = useAppDispatch()
  const swr = useSWRHook();
  const { document, document_loading, document_error } = props.index? swr.useSWRAbstract("document", `query?index=${props.index}&q=${props.id}`): swr.useSWRAbstract("document", `document/${props.id}`);
  const title = document ? PreprocessTitle(document.title) : false;
  const settings = useAppSelector((state) => state.windows.settings);

  if (document_loading || document_error) {
    return <div>Loading...</div>
  }
  
  const handleSetIndex = () => {
    if (props.setIndex) {
      props.setIndex(props.listIndex);
    }
  };
  const handleRead = () => {
    dispatch(mark({document_id: document._id, read: !document.state.read}));
  };


  return (
    <div
      draggable={true}
      onClick={handleSetIndex}
      onDragStart={(e) => onDragStart(e, document._id, "Document")}
      style={{
        ...props.style,
        position: "relative",
        borderBottom: "1px solid  #eceeee",
        paddingTop: "2px",
        paddingBottom: "3px",
        width: "100%",
        height: "100%",
        backgroundColor: props.highlight ? "#EEEEEE" : "white",
      }}
      id={document.id}
    > 
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ marginRight: "0.5em" }}
        >
          <Stack
            direction="row"
            alignItems="center"
            sx={{ marginRight: "0.75em" }}
          >
            <BookmarkSelector id={props.id} />
            {props.showReadIcon ? (
              <IconButton onClick={handleRead}>
                {document?.state?.read ? (
                  <CircleOutlinedIcon sx={{ fontSize: 15 }} />
                ) : (
                  <CircleIcon sx={{ fontSize: 15 }} />
                )}
              </IconButton>
            ) : null}
            <GroupSelector id={props.id} />
          </Stack>
          <DocumentTitle title={title} noWrap={false} />
        </Stack>

        {props.ShowDeleteIcon ? (
          <Deleter 
            callback={() => dispatch(removeDocumentFromGroup({group_id: props.group._id, document_id: props.id}))} 
            color={settings.color}
          />    
        ) : (
          <></>
        )}
      </Stack>
    </div>
  );
}
