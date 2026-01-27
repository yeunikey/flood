import {
  Modal,
  Checkbox,
  Button,
  Divider,
  Typography,
  FormControlLabel,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ModalBox from "@/shared/ui/el/ModalBox";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
import { SiteRecord, useAnalyticSites } from "../model/useAnalyticSites";

interface VariablesSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function VariablesSettingsModal({
  open,
  onClose,
}: VariablesSettingsModalProps) {
  const { toggleDisabledVariable, isVariableDisabled, setDisabledVariables } =
    useAnalyticStore();
  const { activeSites } = useAnalyticSites();

  const records = Object.values(activeSites);

  const handleToggleSiteAll = (
    categoryId: number,
    siteId: number,
    variableIds: number[],
    enable: boolean,
  ) => {
    setDisabledVariables(categoryId, siteId, enable ? [] : variableIds);
  };

  const handleToggleCategoryAll = (record: SiteRecord, enable: boolean) => {
    record.sites.forEach((site) => {
      const allVarIds = record.variables.map((v) => v.id);
      setDisabledVariables(
        record.category.id,
        site.id,
        enable ? [] : allVarIds,
      );
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalBox className="relative w-[900px]! h-[800px] flex flex-col overflow-hidden bg-white rounded-xl">
        <Typography variant="h6" className="mb-4">
          Настройка отображения переменных
        </Typography>

        <Divider className="my-4" />

        <Box className="flex-1 overflow-y-auto">
          {records.length > 0 ? (
            records.map((record) => (
              <Accordion
                key={record.category.id}
                disableGutters
                sx={{
                  mb: 1.5,
                  borderRadius: 1,
                  borderColor: "#e0e0e0",
                  "&:last-child": { mb: 0 },
                }}
                variant="outlined"
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: "#fff",
                    "& .MuiAccordionSummary-content": { my: 1.5 },
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {record.category.name}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 2, bgcolor: "#fbfbfb" }}>
                  <Box display="flex" gap={1} mb={2}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleToggleCategoryAll(record, true)}
                    >
                      Включить все
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleToggleCategoryAll(record, false)}
                    >
                      Выключить все
                    </Button>
                  </Box>

                  {record.sites.map((site) => (
                    <Accordion
                      key={site.id}
                      elevation={0}
                      disableGutters
                      variant="outlined"
                      sx={{
                        mb: 1,
                        borderRadius: 1,
                        borderColor: "#e0e0e0",
                        "&:last-child": { mb: 0 },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          minHeight: 48,
                          "& .MuiAccordionSummary-content": { my: 0 },
                        }}
                      >
                        <Typography variant="body1" fontWeight={600}>
                          {site.name}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 1, pb: 2 }}>
                        <Box display="flex" gap={1} mb={1.5}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              handleToggleSiteAll(
                                record.category.id,
                                site.id,
                                record.variables.map((v) => v.id),
                                true,
                              )
                            }
                          >
                            Включить все
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() =>
                              handleToggleSiteAll(
                                record.category.id,
                                site.id,
                                record.variables.map((v) => v.id),
                                false,
                              )
                            }
                          >
                            Выключить все
                          </Button>
                        </Box>

                        <Box
                          display="grid"
                          gridTemplateColumns="repeat(auto-fill, minmax(220px, 1fr))"
                          gap={1}
                        >
                          {record.variables.length > 0 ? (
                            record.variables.map((v) => {
                              const isDisabled = isVariableDisabled(
                                record.category.id,
                                site.id,
                                v.id,
                              );
                              return (
                                <FormControlLabel
                                  key={`${site.id}-${v.id}`}
                                  control={
                                    <Checkbox
                                      checked={!isDisabled}
                                      onChange={() =>
                                        toggleDisabledVariable(
                                          record.category.id,
                                          site.id,
                                          v.id,
                                        )
                                      }
                                      size="small"
                                    />
                                  }
                                  label={
                                    <Typography
                                      variant="body2"
                                      noWrap
                                      title={v.name}
                                      sx={{ fontSize: "0.875rem" }}
                                    >
                                      {v.name}
                                    </Typography>
                                  }
                                  sx={{ mr: 0 }}
                                />
                              );
                            })
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ gridColumn: "1 / -1" }}
                            >
                              Нет доступных переменных
                            </Typography>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              height="100%"
              color="text.secondary"
            >
              <Typography>Нет выбранных объектов</Typography>
              <Typography variant="caption">
                Выберите объекты в меню навигации слева
              </Typography>
            </Box>
          )}
        </Box>

        <Divider />

        <Box p={2} display="flex" justifyContent="flex-end" bgcolor="white">
          <Button
            variant="contained"
            onClick={onClose}
            size="medium"
            disableElevation
            sx={{ px: 4 }}
          >
            Готово
          </Button>
        </Box>
      </ModalBox>
    </Modal>
  );
}
