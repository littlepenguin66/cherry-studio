import { SwapOutlined } from '@ant-design/icons'
import Scrollbar from '@renderer/components/Scrollbar'
import { TranslateLanguageOptions } from '@renderer/config/translate'
import db from '@renderer/databases'
import { useDefaultModel } from '@renderer/hooks/useAssistant'
import { fetchTranslate } from '@renderer/services/ApiService'
import { getDefaultTranslateAssistant } from '@renderer/services/AssistantService'
import { Assistant, Message } from '@renderer/types'
import { runAsyncFunction, uuid } from '@renderer/utils'
import { Select, Space } from 'antd'
import { isEmpty } from 'lodash'
import { FC, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  text: string
}

let _targetLanguage = 'chinese'

const Translate: FC<Props> = ({ text }) => {
  const [result, setResult] = useState('')
  const [targetLanguage, setTargetLanguage] = useState(_targetLanguage)
  const { translateModel } = useDefaultModel()
  const { t } = useTranslation()

  _targetLanguage = targetLanguage

  const translate = useCallback(async () => {
    if (!text.trim() || !translateModel) return

    const assistant: Assistant = getDefaultTranslateAssistant(targetLanguage, text)
    const message: Message = {
      id: uuid(),
      role: 'user',
      content: text,
      assistantId: assistant.id,
      topicId: uuid(),
      modelId: translateModel.id,
      createdAt: new Date().toISOString(),
      type: 'text',
      status: 'sending'
    }

    await fetchTranslate({ message, assistant, onResponse: setResult })
  }, [text, targetLanguage, translateModel])

  useEffect(() => {
    runAsyncFunction(async () => {
      const targetLang = await db.settings.get({ id: 'translate:target:language' })
      targetLang && setTargetLanguage(targetLang.value)
    })
  }, [])

  useEffect(() => {
    translate()
  }, [translate])

  return (
    <Container>
      <MenuContainer>
        <Select
          showSearch
          value="any"
          style={{ width: 200 }}
          optionFilterProp="label"
          disabled
          options={[{ label: t('translate.any.language'), value: 'any' }]}
        />
        <SwapOutlined />
        <Select
          showSearch
          value={targetLanguage}
          style={{ width: 200 }}
          optionFilterProp="label"
          options={TranslateLanguageOptions}
          onChange={(value) => {
            setTargetLanguage(value)
            db.settings.put({ id: 'translate:target:language', value })
          }}
          optionRender={(option) => (
            <Space>
              <span role="img" aria-label={option.data.label}>
                {option.data.emoji}
              </span>
              {option.label}
            </Space>
          )}
        />
      </MenuContainer>
      <Main>
        {isEmpty(result) ? (
          <LoadingText>{t('translate.output.placeholder')}...</LoadingText>
        ) : (
          <OutputContainer>
            <ResultText>{result}</ResultText>
          </OutputContainer>
        )}
      </Main>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 12px;
  padding-right: 0;
  overflow: hidden;
  -webkit-app-region: none;
`

const Main = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  overflow: hidden;
`

const ResultText = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
  width: 100%;
`

const LoadingText = styled.div`
  color: var(--color-text-2);
  font-style: italic;
`

const MenuContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 15px;
  gap: 20px;
`

const OutputContainer = styled(Scrollbar)`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 10px;
`

export default Translate