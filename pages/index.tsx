import * as React from 'react';
import styled from "styled-components";
import '../style/index.css';
import AppLayout from "../component/AppLayout";
import {getDisplayBlockId, IRecordValue, loadFullPageChunk} from "./api/notion";
import * as moment from 'moment';

const Content = styled.div`
  width: 768px;
  max-width: 90%;
  margin: auto;
`;

const Panel = styled.div`
  margin: 3em 0;
`;

const PostItem = styled.div`
    margin: 8px 0;
`;

const PubDate = styled.span`
   color:#666;
   margin-right: 2em;
`;

interface IProps {
    data: IRecordValue[]
}

interface IState {
}

const PostLink = (props: { page: string, title: string }) => (
    <a href={`/post/${props.page}`}> {props.title}</a>
);

const pageId = "ba8f1c3a528043a995c3149cefff4c18";

class Index extends React.Component<IProps, IState> {
    static async getInitialProps() {
        const list = await loadFullPageChunk(pageId);
        return {
            data: list.filter((it) => it.value.type === 'page').slice(1)
        }
    }

    public render(): React.ReactNode {

        return (
            <AppLayout>
                <Content>
                    <Panel>
                        {this.renderList()}
                    </Panel>
                </Content>
            </AppLayout>
        );
    }


    private renderList(): React.ReactNode {
        const list = this.props.data.map((it, idx) => {
            if (it.value.properties === undefined) {
                return null
            }
            const date = moment(it.value.created_time).format("YYYY-MM-DD");
            return <PostItem key={idx}>
                <PubDate>{date}</PubDate>
                <PostLink page={getDisplayBlockId(it.value.id)} title={it.value.properties.title[0]}/>
            </PostItem>
        });

        return (
            <div>{list}</div>
        );
    }

}

export default Index;