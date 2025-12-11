"use client";

import { SimpleGrid } from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Grid, Mousewheel, Scrollbar } from "swiper/modules";
import { CalendarPerDate } from "./CalendarPerDate";
import { SwiperSlide, Swiper } from "swiper/react";
import { Swiper as SwiperTypes } from "swiper/types";

import "swiper/css";
import "swiper/css/scrollbar";

interface PropTypes {
  value: string;
  onChange: (_value: string) => void;
  chooseMonth: string | null;
  setStartDate: (_value: string) => void;
  setEndDate: (_value: string) => void;
}

export const CalendarPerWeek = (props: PropTypes) => {
  const { value, onChange, chooseMonth, setStartDate, setEndDate } = props;

  const today = dayjs();

  const [start, setStart] = useState<string>("");

  const [end, setEnd] = useState<string>("");

  const swiperRef = useRef<SwiperTypes | null>(null);

  const generateWeeks = (month: dayjs.Dayjs) => {
    const startOfMonth = month.startOf("month");

    const endOfMonth = month.endOf("month");

    const startDay =
      startOfMonth.day() === 1
        ? startOfMonth
        : startOfMonth.subtract((startOfMonth.day() + 6) % 7, "day");

    const endDay =
      endOfMonth.day() === 0
        ? endOfMonth
        : endOfMonth.add(7 - endOfMonth.day(), "day");

    const totalDays = endDay.diff(startDay, "day") + 1;

    const days = Array.from({ length: totalDays }, (_, i) =>
      startDay.add(i, "day"),
    );

    const weeks: dayjs.Dayjs[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  };

  const currentMonth = dayjs(chooseMonth);

  const weeks = useMemo(() => generateWeeks(currentMonth), [chooseMonth]);

  const todayWeekIndex = useMemo(() => {
    return weeks.findIndex((week) =>
      week.some((day) => day.isSame(today, "day")),
    );
  }, [weeks, today]);

  useEffect(() => {
    if (swiperRef.current) {
      if (currentMonth.isSame(today, "month") && todayWeekIndex !== -1) {
        swiperRef.current.slideTo(todayWeekIndex);
      } else {
        swiperRef.current.slideTo(0);
      }
    }
  }, [weeks, todayWeekIndex]);

  return (
    <Swiper
      onSwiper={(swiper) => (swiperRef.current = swiper)}
      onSlideChange={(swiper) => {
        const index = swiper.activeIndex;
        const week = weeks[index];

        if (week) {
          setStartDate(week[0].format("YYYY-MM-DD"));
          setEndDate(week[6].format("YYYY-MM-DD"));

          setStart(week[0].format("YYYY-MM-DD"));
          setEnd(week[6].format("YYYY-MM-DD"));

          onChange("");
        }
      }}
      initialSlide={todayWeekIndex !== -1 ? todayWeekIndex : 0}
      spaceBetween={0}
      scrollbar={{ hide: false }}
      mousewheel
      direction="horizontal"
      modules={[Grid, Scrollbar, Mousewheel]}
      centeredSlides
      style={{ width: "100%", height: 65, justifyItems: "center" }}
      className="mySwiper">
      {weeks.map((week, i) => (
        <SwiperSlide key={i}>
          <SimpleGrid
            w={"100%"}
            cols={7}
            spacing={0}
            verticalSpacing={0}
            style={{
              justifyItems: "center",
            }}>
            {week.map((day, j) => {
              const isCurrentMonth = day.month() === currentMonth.month();
              const isWeekend = day.day() === 0 || day.day() === 6;
              const isToday = day.isSame(today, "day");
              // const isPast = day.isBefore(today, "day");
              // const disabled = !isCurrentMonth || (isPast && !isToday);

              const isSelected = day.isSame(dayjs(value), "day");

              return (
                <CalendarPerDate
                  key={j}
                  isCurrentMonth={isCurrentMonth}
                  day={day}
                  isSelected={isSelected}
                  isWeekend={isWeekend}
                  isToday={isToday}
                  onSelect={(date) => {
                    if (date.format("YYYY-MM-DD") === value) {
                      onChange("");
                      setStartDate(start);
                      setEndDate(end);
                    } else {
                      onChange(date.format("YYYY-MM-DD"));
                      setStartDate("");
                      setEndDate("");
                    }
                  }}
                />
              );
            })}
          </SimpleGrid>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};
